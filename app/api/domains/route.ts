import { NextResponse } from 'next/server'
import { Domain } from '@/lib/types'

export const dynamic = 'force-dynamic'

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4'

interface CloudflareZone {
  id: string
  name: string
  status: string
  name_servers: string[]
  created_on: string
}

async function fetchCloudflareZones(): Promise<CloudflareZone[]> {
  const zones: CloudflareZone[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones?page=${page}&per_page=50`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`)
    }

    const data = await response.json()
    zones.push(...data.result)

    // Check if there are more pages
    const totalPages = data.result_info?.total_pages || 1
    hasMore = page < totalPages
    page++
  }

  return zones
}

async function checkHttpStatus(domain: string): Promise<{ status: number; category: 'healthy' | 'redirect' | 'down' }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const status = response.status
    let category: 'healthy' | 'redirect' | 'down' = 'down'

    if (status >= 200 && status < 300) {
      category = 'healthy'
    } else if (status >= 300 && status < 400) {
      category = 'redirect'
    }

    return { status, category }
  } catch {
    return { status: 0, category: 'down' }
  }
}

export async function GET() {
  try {
    if (!CLOUDFLARE_API_TOKEN) {
      console.error('CLOUDFLARE_API_TOKEN not configured')
      return NextResponse.json({
        domains: [],
        lastSynced: new Date().toISOString(),
        error: 'Cloudflare API token not configured'
      })
    }

    const zones = await fetchCloudflareZones()
    const now = new Date()

    // Process domains (limit HTTP checks to avoid timeout)
    const domains: Domain[] = await Promise.all(
      zones.map(async (zone, index) => {
        // Only check HTTP status for first 20 domains to avoid timeout
        let httpStatus = 0
        let statusCategory: 'healthy' | 'redirect' | 'down' = 'down'

        if (index < 20) {
          const statusCheck = await checkHttpStatus(zone.name)
          httpStatus = statusCheck.status
          statusCategory = statusCheck.category
        }

        return {
          id: zone.id,
          domain: zone.name,
          httpStatus,
          statusCategory,
          registrar: 'Unknown', // Would need WHOIS lookup
          nameServers: zone.name_servers?.join(', ') || '',
          expirationDate: null, // Would need WHOIS lookup
          createdDate: zone.created_on,
          lastChecked: now.toISOString(),
          cloudflareZoneId: zone.id,
          renewalStatus: 'unknown' as const,
          daysUntilExpiration: null,
        }
      })
    )

    return NextResponse.json({
      domains,
      lastSynced: now.toISOString(),
      total: zones.length
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
