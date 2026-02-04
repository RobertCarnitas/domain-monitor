'use client'

import { DomainProvider, useDomainData } from '@/lib/domain-context'
import { Header } from '@/components/header'
import { StatusSection } from '@/components/status-section'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

function DashboardContent() {
  const { loading, error } = useDomainData()

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load domains</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <StatusSection title="Website Status" type="website" />
      <StatusSection title="Renewal Status" type="renewal" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DomainProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Overview</h2>
            <p className="text-muted-foreground">
              Monitor your domains for website status and renewal deadlines
            </p>
          </div>
          <DashboardContent />
        </main>
      </div>
    </DomainProvider>
  )
}
