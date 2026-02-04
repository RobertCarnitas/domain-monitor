import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

interface GoogleDNSResponse {
  Status: number
  Answer?: Array<{
    name: string
    type: number
    TTL: number
    data: string
  }>
}

interface DNSRecord {
  type: string
  name: string
  value: string
  ttl: number
}

// DNS record type mapping
const DNS_TYPE_MAP: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = decodeURIComponent(params.domain)

  try {
    const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']
    const records: DNSRecord[] = []

    // Fetch DNS records in parallel using Google DNS-over-HTTPS
    const promises = recordTypes.map(async (type) => {
      try {
        const response = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
          {
            cache: 'no-store',
            headers: {
              'Accept': 'application/dns-json'
            }
          }
        )

        if (response.ok) {
          const data: GoogleDNSResponse = await response.json()
          if (data.Answer) {
            return data.Answer.map((answer) => ({
              type: DNS_TYPE_MAP[answer.type] || type,
              name: answer.name,
              value: answer.data,
              ttl: answer.TTL
            }))
          }
        }
        return []
      } catch {
        return []
      }
    })

    const results = await Promise.all(promises)
    results.forEach(result => records.push(...result))

    // Sort records by type
    records.sort((a, b) => {
      const typeOrder = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT']
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Error fetching DNS records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DNS records', records: [] },
      { status: 500 }
    )
  }
}
