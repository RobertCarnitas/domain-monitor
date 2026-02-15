'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Globe, Calendar, Server, Shield } from 'lucide-react'
import { DomainProvider, useDomainData } from '@/lib/domain-context'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DNSRecordsTable } from '@/components/dns-records-table'
import { formatDate, formatDateTime, getStatusExplanation } from '@/lib/utils'
import type { DNSRecord, Domain } from '@/lib/types'

function DomainDetailContent() {
  const params = useParams()
  const domainName = decodeURIComponent(params.domain as string)
  const { domains, loading: domainsLoading } = useDomainData()
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([])
  const [dnsLoading, setDnsLoading] = useState(true)

  const domainData = domains.find(d => d.domain === domainName)

  useEffect(() => {
    async function fetchDNS() {
      try {
        setDnsLoading(true)
        const response = await fetch(`/api/dns/${encodeURIComponent(domainName)}`)
        if (response.ok) {
          const data = await response.json()
          setDnsRecords(data.records || [])
        }
      } catch (error) {
        console.error('Failed to fetch DNS records:', error)
      } finally {
        setDnsLoading(false)
      }
    }
    fetchDNS()
  }, [domainName])

  if (domainsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!domainData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold mb-2">Domain not found</h2>
        <p className="text-muted-foreground mb-4">
          The domain &quot;{domainName}&quot; was not found in your monitored domains.
        </p>
        <Button asChild>
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            {domainData.domain}
          </h1>
          <p className="text-muted-foreground">
            Last checked: {formatDateTime(domainData.lastChecked)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(domainData.statusCategory)}>
            {domainData.statusCategory}
          </Badge>
          <Badge variant={getRenewalBadgeVariant(domainData.renewalStatus)}>
            {domainData.renewalStatus}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <a href={`https://${domainData.domain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit
            </a>
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiration Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatDate(domainData.expirationDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {domainData.daysUntilExpiration !== null
                ? domainData.daysUntilExpiration > 0
                  ? `${domainData.daysUntilExpiration} days remaining`
                  : `Expired ${Math.abs(domainData.daysUntilExpiration)} days ago`
                : 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Server className="h-4 w-4" />
              Name Servers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {domainData.nameServers.split(', ').map((ns, i) => (
                <p key={i} className="text-sm font-mono truncate" title={ns}>
                  {ns}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Registrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {domainData.registrar || 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              HTTP Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {domainData.httpStatus || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              {getStatusExplanation(domainData.httpStatus, domainData.statusCategory)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DNS Records */}
      <Card>
        <CardHeader>
          <CardTitle>Public DNS Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DNSRecordsTable records={dnsRecords} loading={dnsLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusBadgeVariant(status: Domain['statusCategory']): 'destructive' | 'warning' | 'success' | 'secondary' {
  switch (status) {
    case 'down': return 'destructive'
    case 'redirect': return 'warning'
    case 'healthy': return 'success'
    case 'unchecked': return 'secondary'
    default: return 'secondary'
  }
}

function getRenewalBadgeVariant(status: Domain['renewalStatus']): 'destructive' | 'warning' | 'success' | 'secondary' {
  switch (status) {
    case 'expired': return 'destructive'
    case 'warning': return 'warning'
    case 'healthy': return 'success'
    case 'unknown': return 'secondary'
    default: return 'success'
  }
}

export default function DomainDetailPage() {
  return (
    <DomainProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </header>
        <main className="container mx-auto p-6">
          <DomainDetailContent />
        </main>
      </div>
    </DomainProvider>
  )
}
