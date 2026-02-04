import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_BASE_URL

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
        ...(process.env.N8N_AUTH_HEADER && {
          'Authorization': process.env.N8N_AUTH_HEADER
        })
      }
    })

    if (!response.ok) {
      throw new Error('Failed to trigger sync')
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      summary: data
    })
  } catch (error) {
    console.error('Error triggering sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
