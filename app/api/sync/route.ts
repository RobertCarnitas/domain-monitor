import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

export async function POST() {
  try {
    if (!N8N_WEBHOOK_URL) {
      // Simulate sync for development
      await new Promise(resolve => setTimeout(resolve, 2000))
      return NextResponse.json({
        success: true,
        message: 'Sync simulated (n8n not configured)',
        summary: {
          domainsProcessed: 6,
          domainsUpdated: 6,
          errors: []
        }
      })
    }

    const response = await fetch(`${N8N_WEBHOOK_URL}/sync-domains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(process.env.N8N_AUTH_HEADER && {
          'Authorization': process.env.N8N_AUTH_HEADER
        })
      }
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error('n8n sync response:', response.status, response.statusText, errorBody.substring(0, 500))
      throw new Error(`Failed to trigger sync: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()
    let data: unknown
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('n8n sync returned non-JSON:', responseText.substring(0, 500))
      throw new Error('n8n sync returned non-JSON response (possibly ngrok interstitial or HTML error page)')
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      summary: data
    })
  } catch (error) {
    console.error('Error triggering sync:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
