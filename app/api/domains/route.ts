import { NextResponse } from 'next/server'
import { Domain } from '@/lib/types'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

// n8n data table returns camelCase field names
interface N8nDomainRow {
  id: number
  domain: string
  cloudflareZoneId: string
  nameServers: string | null
  registrar: string | null
  expirationDate: string | null
  createdDate: string | null
  httpStatus: string | number | null  // n8n returns as string
  statusCategory: string | null
  lastChecked: string | null
  renewalStatus: string | null
  daysUntilExpiration: number | null
  excluded: boolean | string | null
  redirectTo: string | null
  triageStatus: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Sanitize expiration date - n8n may store raw expressions like "{{ $json.expires }}"
 * instead of actual dates. Returns null for any invalid date value.
 */
function sanitizeExpirationDate(value: string | null | undefined): string | null {
  if (!value) return null
  // Reject n8n expression strings that were never evaluated
  if (value.includes('{{') || value.includes('$json')) return null
  // Check if it's a valid date
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  return value
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

function parseStatusCategory(n8nStatusCategory: string | null): { category: string, redirectTo: string } {
  if (!n8nStatusCategory) return { category: 'unknown', redirectTo: '' }
  // Parse encoded redirect target: 'redirect:targetdomain.com'
  if (n8nStatusCategory.startsWith('redirect:')) {
    return { category: 'redirect', redirectTo: n8nStatusCategory.substring('redirect:'.length) }
  }
  return { category: n8nStatusCategory, redirectTo: '' }
}

function getStatusCategory(httpStatus: number | null, n8nStatusCategory: string | null): 'healthy' | 'redirect' | 'down' | 'unchecked' {
  // Trust n8n's explicit status category when set
  if (n8nStatusCategory === 'redirect') return 'redirect'
  if (n8nStatusCategory === 'down' || n8nStatusCategory === 'pending-down') return 'down'
  // If n8n never checked this domain
  if ((!httpStatus || httpStatus === 0) && (!n8nStatusCategory || n8nStatusCategory === 'unknown')) {
    return 'unchecked'
  }
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
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error('n8n webhook response:', response.status, response.statusText, errorBody.substring(0, 500))
      throw new Error(`n8n webhook error: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let n8nData: any
    try {
      n8nData = JSON.parse(responseText)
    } catch {
      console.error('n8n returned non-JSON response:', responseText.substring(0, 500))
      throw new Error('n8n webhook returned non-JSON response (possibly ngrok interstitial or HTML error page)')
    }
    const now = new Date()

    // Handle both array response and object with data property
    const rows: N8nDomainRow[] = Array.isArray(n8nData) ? n8nData : (n8nData.data || n8nData.rows || [])

    // Deduplicate domains - keep the one with valid httpStatus (non-zero) or most recently updated
    const domainMap = new Map<string, N8nDomainRow>()
    for (const row of rows) {
      // Skip internal config rows (e.g. __slack_config__)
      if (row.domain && row.domain.startsWith('__')) continue
      const existing = domainMap.get(row.domain)
      if (!existing) {
        domainMap.set(row.domain, row)
      } else {
        // Prefer the row with valid httpStatus (non-zero)
        const existingStatus = typeof existing.httpStatus === 'string' ? parseInt(existing.httpStatus, 10) : (existing.httpStatus || 0)
        const newStatus = typeof row.httpStatus === 'string' ? parseInt(row.httpStatus, 10) : (row.httpStatus || 0)

        if (newStatus > 0 && existingStatus === 0) {
          domainMap.set(row.domain, row)
        } else if (existingStatus === 0 && newStatus === 0) {
          // Both have no status, keep the most recently updated
          if (new Date(row.updatedAt) > new Date(existing.updatedAt)) {
            domainMap.set(row.domain, row)
          }
        }
      }
    }
    const deduplicatedRows = Array.from(domainMap.values())

    // Transform n8n data to our Domain type
    const domains: Domain[] = deduplicatedRows.map((d: N8nDomainRow) => {
      // Parse httpStatus - n8n may return it as string
      const httpStatusNum = typeof d.httpStatus === 'string' ? parseInt(d.httpStatus, 10) : (d.httpStatus || 0)

      // Sanitize expiration date - n8n may have stored raw expressions like "{{ $json.expires }}"
      const cleanExpirationDate = sanitizeExpirationDate(d.expirationDate)

      // Calculate renewal status from sanitized expiration date
      const { status: renewalStatus, days: daysUntilExpiration } = calculateRenewalStatus(cleanExpirationDate)

      // Parse statusCategory — may contain encoded redirect target like 'redirect:targetdomain.com'
      const { category: parsedCategory, redirectTo: parsedRedirectTo } = parseStatusCategory(d.statusCategory)

      // Get status category from HTTP status, using n8n's stored category to detect unchecked domains
      const statusCategory = getStatusCategory(httpStatusNum, parsedCategory)

      // Use redirectTo from n8n response if available, otherwise from parsed statusCategory
      const redirectTo = d.redirectTo || parsedRedirectTo || ''

      return {
        id: d.id.toString(),
        domain: d.domain,
        httpStatus: httpStatusNum,
        statusCategory,
        registrar: d.registrar || 'Unknown',
        nameServers: d.nameServers || '',
        expirationDate: cleanExpirationDate,
        createdDate: d.createdDate,
        lastChecked: d.lastChecked || d.updatedAt,
        cloudflareZoneId: d.cloudflareZoneId,
        renewalStatus,
        daysUntilExpiration,
        excluded: (d.triageStatus || '').startsWith('excluded:'),
        redirectTo,
        triageStatus: ((d.triageStatus || '').replace(/^excluded:/, '') as '' | 'investigating' | 'resolved' | 'non-issue') || '',
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
