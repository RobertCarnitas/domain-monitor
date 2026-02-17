import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { webhookUrl } = body

    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return NextResponse.json(
        { success: false, message: 'Invalid Slack webhook URL' },
        { status: 400 }
      )
    }

    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { success: false, message: 'n8n webhook URL not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`${N8N_WEBHOOK_URL}/test-slack`, {
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

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to send test' },
      { status: 500 }
    )
  }
}
