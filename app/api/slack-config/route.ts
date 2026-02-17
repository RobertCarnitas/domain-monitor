import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || ''

export async function GET() {
  try {
    if (!N8N_WEBHOOK_URL) {
      // Fall back to env var only
      return NextResponse.json({
        webhookUrl: SLACK_WEBHOOK_URL,
        enabled: SLACK_WEBHOOK_URL.startsWith('https://hooks.slack.com/'),
      })
    }

    const response = await fetch(`${N8N_WEBHOOK_URL}/slack-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      // Fall back to env var if n8n config doesn't exist yet
      return NextResponse.json({
        webhookUrl: SLACK_WEBHOOK_URL,
        enabled: SLACK_WEBHOOK_URL.startsWith('https://hooks.slack.com/'),
      })
    }

    const raw = await response.json()
    // n8n respondToWebhook returns an array of items
    const data = Array.isArray(raw) ? raw[0] : raw
    // If n8n returned empty config, fall back to env var
    const webhookUrl = (data && data.webhookUrl) || SLACK_WEBHOOK_URL
    return NextResponse.json({
      webhookUrl,
      enabled: webhookUrl.startsWith('https://hooks.slack.com/'),
    })
  } catch {
    return NextResponse.json({
      webhookUrl: SLACK_WEBHOOK_URL,
      enabled: SLACK_WEBHOOK_URL.startsWith('https://hooks.slack.com/'),
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { webhookUrl } = body

    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'n8n webhook URL not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`${N8N_WEBHOOK_URL}/slack-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ webhookUrl }),
    })

    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save config' },
      { status: 500 }
    )
  }
}
