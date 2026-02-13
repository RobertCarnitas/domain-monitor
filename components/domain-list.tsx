'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusExplanation } from '@/lib/utils'
import type { Domain } from '@/lib/types'

interface DomainListProps {
  domains: Domain[]
  type: 'website' | 'renewal'
}

export function DomainList({ domains, type }: DomainListProps) {
  const router = useRouter()

  if (domains.length === 0) {
    return (
      <div className="mt-2 p-4 text-center text-muted-foreground border-l-2 border-muted ml-4">
        No domains in this category
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted">
      {domains.map(domain => (
        <button
          key={domain.domain}
          onClick={() => router.push(`/domains/${encodeURIComponent(domain.domain)}`)}
          className="w-full flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted transition-colors text-left border"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{domain.domain}</p>
            <p className="text-sm text-muted-foreground truncate">
              {type === 'website'
                ? getStatusExplanation(domain.httpStatus)
                : getExpirationExplanation(domain.daysUntilExpiration)
              }
            </p>
          </div>
          <Badge variant={getBadgeVariant(domain, type)} className="ml-2 shrink-0">
            {type === 'website'
              ? domain.statusCategory === 'unchecked' ? 'N/A' : `${domain.httpStatus}`
              : domain.daysUntilExpiration !== null
                ? `${domain.daysUntilExpiration}d`
                : 'N/A'
            }
          </Badge>
        </button>
      ))}
    </div>
  )
}

function getExpirationExplanation(days: number | null): string {
  if (days === null) return 'Expiration date unknown'
  if (days < 0) return `Expired ${Math.abs(days)} days ago`
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  if (days <= 14) return `Expires in ${days} days`
  return `Expires on ${formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())}`
}

function getBadgeVariant(domain: Domain, type: 'website' | 'renewal'): 'destructive' | 'warning' | 'success' | 'secondary' {
  if (type === 'website') {
    if (domain.statusCategory === 'down') return 'destructive'
    if (domain.statusCategory === 'redirect') return 'warning'
    if (domain.statusCategory === 'unchecked') return 'secondary'
    return 'success'
  } else {
    if (domain.renewalStatus === 'expired') return 'destructive'
    if (domain.renewalStatus === 'warning') return 'warning'
    if (domain.renewalStatus === 'unknown') return 'secondary'
    return 'success'
  }
}
