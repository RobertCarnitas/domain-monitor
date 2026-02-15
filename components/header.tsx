'use client'

import { RefreshCw, Globe, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useDomainData } from '@/lib/domain-context'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Header() {
  const { triggerSync, syncing, lastSynced } = useDomainData()
  const { data: session } = useSession()

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
          <div className="flex items-center gap-3">
            <Button
              onClick={triggerSync}
              disabled={syncing}
              variant="outline"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            {session?.user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {session.user.email}
                </span>
                <Button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  variant="ghost"
                  size="icon"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
