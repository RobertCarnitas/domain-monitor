'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, MoreHorizontal, Search, CheckCircle2, MinusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusExplanation } from '@/lib/utils'
import { useDomainData } from '@/lib/domain-context'
import type { Domain } from '@/lib/types'

interface DomainListProps {
  domains: Domain[]
  type: 'website' | 'renewal'
}

const TRIAGE_OPTIONS = [
  { value: 'investigating' as const, label: 'Investigating', icon: Search, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'resolved' as const, label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'non-issue' as const, label: 'Non-Issue', icon: MinusCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
] as const

function isTriageable(domain: Domain, type: 'website' | 'renewal'): boolean {
  if (type === 'website') {
    return domain.statusCategory === 'down' || domain.statusCategory === 'redirect'
  } else {
    return domain.renewalStatus === 'expired' || domain.renewalStatus === 'warning'
  }
}

function TriageDropdown({ domain, type }: { domain: Domain; type: 'website' | 'renewal' }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { setTriageStatus } = useDomainData()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  if (!isTriageable(domain, type)) return null

  const currentOption = TRIAGE_OPTIONS.find(o => o.value === domain.triageStatus)

  return (
    <div ref={dropdownRef} className="relative">
      {currentOption ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${currentOption.color} hover:opacity-80 transition-opacity`}
          title={`Triage: ${currentOption.label}`}
        >
          <currentOption.icon className="h-3 w-3" />
          {currentOption.label}
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Set triage status"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md py-1 min-w-[140px]">
          {TRIAGE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation()
                // Toggle off if clicking the same status
                if (domain.triageStatus === option.value) {
                  setTriageStatus(domain.domain, '')
                } else {
                  setTriageStatus(domain.domain, option.value)
                }
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors text-left ${
                domain.triageStatus === option.value ? 'bg-muted font-medium' : ''
              }`}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          ))}
          {domain.triageStatus && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setTriageStatus(domain.domain, '')
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors text-left text-muted-foreground"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
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
            <TriageDropdown domain={domain} type={type} />
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
                if (!domain.triageStatus) return
                toggleExclusion(domain.domain, true)
              }}
              className={`p-1 rounded transition-colors ${
                domain.triageStatus
                  ? 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                  : 'text-muted-foreground/30 cursor-not-allowed'
              }`}
              title={domain.triageStatus ? 'Exclude domain' : 'Set a triage tag first'}
              disabled={!domain.triageStatus}
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
