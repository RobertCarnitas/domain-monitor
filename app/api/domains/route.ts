import { NextResponse } from 'next/server'
import { Domain } from '@/lib/types'
import { getSupabase, SupabaseDomain } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Supabase not configured')
      return NextResponse.json({
        domains: [],
        lastSynced: new Date().toISOString(),
        error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
      })
    }

    // Fetch all domains from Supabase
    const supabase = getSupabase()
    const { data: supabaseDomains, error } = await supabase
      .from('domains')
      .select('*')
      .order('domain', { ascending: true })

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    const now = new Date()

    // Transform Supabase domains to our Domain type
    const domains: Domain[] = (supabaseDomains as SupabaseDomain[]).map((d) => {
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
