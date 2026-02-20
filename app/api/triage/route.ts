import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { domain, triageStatus, excluded } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'n8n webhook URL not configured' },
        { status: 500 }
      )
    }

    // Send excluded flag so n8n can preserve the 'excluded:' prefix in triageStatus
    const response = await fetch(`${N8N_WEBHOOK_URL}/set-triage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ domain, triageStatus: triageStatus || '', excluded: excluded || false }),
    })

    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save triage status' },
      { status: 500 }
    )
  }
}
