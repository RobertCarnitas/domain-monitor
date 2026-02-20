import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

export async function POST(request: Request) {
  try {
    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'n8n webhook URL not configured' },
        { status: 500 }
      )
    }

    const { domain, excluded, triageStatus } = await request.json()

    if (!domain || typeof excluded !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: domain (string) and excluded (boolean)' },
        { status: 400 }
      )
    }

    // Call n8n webhook to toggle exclusion in the data table
    // The n8n workflow encodes exclusion into the triageStatus field
    // (e.g. 'excluded:investigating' vs 'investigating')
    const response = await fetch(`${N8N_WEBHOOK_URL}/toggle-exclusion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ domain, excluded, triageStatus: triageStatus || '' }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error('n8n toggle-exclusion error:', response.status, errorBody.substring(0, 500))
      throw new Error(`n8n webhook error: ${response.status}`)
    }

    return NextResponse.json({ success: true, domain, excluded })
  } catch (error) {
    console.error('Error toggling exclusion:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
