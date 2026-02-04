import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_BASE_URL

export async function GET() {
  try {
    if (!N8N_WEBHOOK_URL) {
      // Return mock data if n8n is not configured
      return NextResponse.json({
        domains: getMockDomains(),
        lastSynced: new Date().toISOString()
      })
    }

    const response = await fetch(`${N8N_WEBHOOK_URL}/get-domains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_AUTH_HEADER && {
          'Authorization': process.env.N8N_AUTH_HEADER
        })
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch domains from n8n')
    }

    const data = await response.json()
    return NextResponse.json({
      domains: data,
      lastSynced: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching domains:', error)
    // Return mock data on error for development
    return NextResponse.json({
      domains: getMockDomains(),
      lastSynced: new Date().toISOString()
    })
  }
}

// Mock data for development/testing
function getMockDomains() {
  const now = new Date()
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  const expiredDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

  return [
    {
      id: '1',
      domain: 'example.com',
      httpStatus: 200,
      statusCategory: 'healthy',
      registrar: 'GoDaddy',
      nameServers: 'ns1.example.com, ns2.example.com',
      expirationDate: oneYearFromNow.toISOString(),
      createdDate: '2020-01-15T00:00:00Z',
      lastChecked: now.toISOString(),
      cloudflareZoneId: 'zone123',
      renewalStatus: 'healthy',
      daysUntilExpiration: 365
    },
    {
      id: '2',
      domain: 'redirect-site.com',
      httpStatus: 301,
      statusCategory: 'redirect',
      registrar: 'Namecheap',
      nameServers: 'dns1.namecheap.com, dns2.namecheap.com',
      expirationDate: oneMonthFromNow.toISOString(),
      createdDate: '2019-06-20T00:00:00Z',
      lastChecked: now.toISOString(),
      cloudflareZoneId: 'zone456',
      renewalStatus: 'healthy',
      daysUntilExpiration: 30
    },
    {
      id: '3',
      domain: 'down-site.org',
      httpStatus: 503,
      statusCategory: 'down',
      registrar: 'Cloudflare',
      nameServers: 'ns1.cloudflare.com, ns2.cloudflare.com',
      expirationDate: oneWeekFromNow.toISOString(),
      createdDate: '2021-03-10T00:00:00Z',
      lastChecked: now.toISOString(),
      cloudflareZoneId: 'zone789',
      renewalStatus: 'warning',
      daysUntilExpiration: 7
    },
    {
      id: '4',
      domain: 'expired-domain.net',
      httpStatus: 0,
      statusCategory: 'down',
      registrar: 'Google Domains',
      nameServers: 'ns1.google.com, ns2.google.com',
      expirationDate: expiredDate.toISOString(),
      createdDate: '2018-11-05T00:00:00Z',
      lastChecked: now.toISOString(),
      cloudflareZoneId: 'zoneabc',
      renewalStatus: 'expired',
      daysUntilExpiration: -5
    },
    {
      id: '5',
      domain: 'temp-redirect.io',
      httpStatus: 302,
      statusCategory: 'redirect',
      registrar: 'Route53',
      nameServers: 'ns-1.awsdns.com, ns-2.awsdns.com',
      expirationDate: twoWeeksFromNow.toISOString(),
      createdDate: '2022-08-22T00:00:00Z',
      lastChecked: now.toISOString(),
      cloudflareZoneId: 'zonedef',
      renewalStatus: 'warning',
      daysUntilExpiration: 14
    },
    {
      id: '6',
      domain: 'healthy-site.co',
      httpStatus: 200,
      statusCategory: 'healthy',
      registrar: 'Namecheap',
      nameServers: 'dns1.namecheap.com, dns2.namecheap.com',
      expirationDate: oneYearFromNow.toISOString(),
      createdDate: '2020-05-15T00:00:00Z',
      lastChecked: now.toISOString(),
      cloudflareZoneId: 'zoneghi',
      renewalStatus: 'healthy',
      daysUntilExpiration: 365
    }
  ]
}
