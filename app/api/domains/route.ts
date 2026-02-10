import { NextResponse } from 'next/server'
import { Domain } from '@/lib/types'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

interface N8nDomainRow {
  id: number
  domain: string
  cloudflare_zone_id: string
  name_servers: string | null
  registrar: string | null
  expiration_date: string | null
  created_date: string | null
  http_status: number | null
  last_checked: string | null
  created_at: string
  updated_at: string
}

function calculateRenewalStatus(expirationDate: string | null): { status: 'healthy' | 'warning' | 'expired' | 'unknown', days: number | null } {
  if (!expirationDate) {
    return { status: 'unknown', days: null }
  }

  const now = new Date()
  const expDate = new Date(expirationDate)
  const diffTime = expDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'expired', days: diffDays }
  } else if (diffDays <= 30) {
    return { status: 'warning', days: diffDays }
  } else {
    return { status: 'healthy', days: diffDays }
  }
}

function getStatusCategory(httpStatus: number | null): 'healthy' | 'redirect' | 'down' {
  if (!httpStatus || httpStatus === 0) return 'down'
  if (httpStatus >= 200 && httpStatus < 300) return 'healthy'
  if (httpStatus >= 300 && httpStatus < 400) return 'redirect'
  return 'down'
}

export async function GET() {
  try {
    if (!N8N_WEBHOOK_URL) {
      console.error('N8N_WEBHOOK_URL not configured')
      return NextResponse.json({
        domains: [],
        lastSynced: new Date().toISOString(),
        error: 'n8n webhook URL not configured. Please set N8N_WEBHOOK_URL environment variable.'
      })
    }

    // Fetch domains from n8n webhook (which reads from n8n data tables)
    const response = await fetch(`${N8N_WEBHOOK_URL}/get-domains`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.status} ${response.statusText}`)
    }

    const n8nData = await response.json()
    const now = new Date()

    // Handle both array response and object with data property
    const rows: N8nDomainRow[] = Array.isArray(n8nData) ? n8nData : (n8nData.data || n8nData.rows || [])

    // Transform n8n data to our Domain type
    const domains: Domain[] = rows.map((d: N8nDomainRow) => {
      const { status: renewalStatus, days: daysUntilExpiration } = calculateRenewalStatus(d.expiration_date)
      const statusCategory = getStatusCategory(d.http_status)

      return {
        id: d.id.toString(),
        domain: d.domain,
        httpStatus: d.http_status || 0,
        statusCategory,
        registrar: d.registrar || 'Unknown',
        nameServers: d.name_servers || '',
        expirationDate: d.expiration_date,
        createdDate: d.created_date,
        lastChecked: d.last_checked || d.updated_at,
        cloudflareZoneId: d.cloudflare_zone_id,
        renewalStatus,
        daysUntilExpiration,
      }
    })

    return NextResponse.json({
      domains,
      lastSynced: now.toISOString(),
      total: domains.length
    })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json({
      domains: [],
      lastSynced: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
