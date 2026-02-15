'use client'

import { useRouter } from 'next/navigation'
import { Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusExplanation } from '@/lib/utils'
import { useDomainData } from '@/lib/domain-context'
import type { Domain } from '@/lib/types'

interface DomainListProps {
  domains: Domain[]
  type: 'website' | 'renewal'
}

export function DomainList({ domains, type }: DomainListProps) {
  const router = useRouter()
  const { toggleExclusion } = useDomainData()

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
        <div
          key={domain.domain}
          className="w-full flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted transition-colors text-left border"
        >
          <button
            onClick={() => router.push(`/domains/${encodeURIComponent(domain.domain)}`)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="font-medium truncate">{domain.domain}</p>
            <p className="text-sm text-muted-foreground truncate">
              {type === 'website'
                ? domain.statusCategory === 'redirect' && domain.redirectTo
                  ? `Redirects to ${domain.redirectTo}`
                  : getStatusExplanation(domain.httpStatus, domain.statusCategory)
                : domain.renewalStatus === 'unknown'
                  ? getUnknownRenewalReason(domain.domain)
                  : getExpirationExplanation(domain.daysUntilExpiration)
              }
            </p>
          </button>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <Badge variant={getBadgeVariant(domain, type)}>
              {type === 'website'
                ? domain.statusCategory === 'unchecked' ? 'N/A'
                  : domain.statusCategory === 'redirect' ? '301'
                  : domain.statusCategory === 'down' && domain.httpStatus === 0 ? 'DOWN'
                  : `${domain.httpStatus}`
                : domain.renewalStatus === 'unknown'
                  ? getRenewalBadgeLabel(domain.domain)
                  : domain.daysUntilExpiration !== null
                    ? `${domain.daysUntilExpiration}d`
                    : 'N/A'
              }
            </Badge>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExclusion(domain.domain, true)
              }}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Exclude domain"
            >
              <Ban className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
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

// TLDs that don't support RDAP lookups — explain why expiration is unknown
const RDAP_UNSUPPORTED_TLDS = ['.io', '.us', '.ai', '.gg', '.tv', '.cc', '.ws', '.fm', '.am', '.ly']

function getUnknownRenewalReason(domain: string): string {
  const tld = '.' + domain.split('.').slice(-1)[0]
  if (RDAP_UNSUPPORTED_TLDS.includes(tld)) {
    return `RDAP not available for ${tld} domains`
  }
  return 'Expiration date unknown'
}

function getRenewalBadgeLabel(domain: string): string {
  const tld = '.' + domain.split('.').slice(-1)[0]
  if (RDAP_UNSUPPORTED_TLDS.includes(tld)) {
    return tld
  }
  return 'N/A'
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
