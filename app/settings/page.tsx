'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Save, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [showUrl, setShowUrl] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/slack-config')
      .then(res => res.json())
      .then(data => {
        setWebhookUrl(data.webhookUrl || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/slack-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setMessage({ type: 'success', text: 'Slack webhook URL saved' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save webhook URL' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/slack-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Test alert sent — check your Slack channel' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send test alert' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send test alert' })
    } finally {
      setTesting(false)
    }
  }

  const maskedUrl = webhookUrl
    ? webhookUrl.substring(0, 30) + '...' + webhookUrl.substring(webhookUrl.length - 10)
    : ''

  const isValidUrl = webhookUrl.startsWith('https://hooks.slack.com/')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Slack Alerts</CardTitle>
            <CardDescription>
              Get notified in Slack when domain statuses change
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading configuration...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showUrl ? 'text' : 'password'}
                        value={showUrl ? webhookUrl : maskedUrl || webhookUrl}
                        onChange={(e) => {
                          setWebhookUrl(e.target.value)
                          setShowUrl(true)
                        }}
                        onFocus={() => setShowUrl(true)}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowUrl(!showUrl)}
                      title={showUrl ? 'Hide URL' : 'Show URL'}
                    >
                      {showUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing || !isValidUrl}
                  >
                    {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Test Alert
                  </Button>
                </div>

                {message && (
                  <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                    {message.text}
                  </p>
                )}

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Alert Rules</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Site goes down (was previously healthy or redirect)</li>
                    <li>New redirect detected (was previously healthy)</li>
                    <li>Domain expiring within 7, 3, or 1 days</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Alerts fire on status changes only — you won&apos;t be spammed with repeated notifications.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
