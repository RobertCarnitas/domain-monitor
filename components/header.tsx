'use client'

import { RefreshCw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDomainData } from '@/lib/domain-context'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Header() {
  const { triggerSync, syncing, lastSynced } = useDomainData()

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Domain Monitor</h1>
              {lastSynced && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {formatDateTime(lastSynced)}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={triggerSync}
            disabled={syncing}
            variant="outline"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </header>
  )
}
