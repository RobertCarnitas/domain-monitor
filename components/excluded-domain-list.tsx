'use client'

import { useState, useRef, useEffect } from 'react'
import { RotateCcw, Search, CheckCircle2, MinusCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDomainData } from '@/lib/domain-context'
import type { Domain } from '@/lib/types'

const TRIAGE_OPTIONS = [
  { value: 'investigating' as const, label: 'Investigating', icon: Search, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'resolved' as const, label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'non-issue' as const, label: 'Non-Issue', icon: MinusCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
] as const

function ExcludedTriageDropdown({ domain }: { domain: Domain }) {
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

export function ExcludedDomainList({ domains }: { domains: Domain[] }) {
  const { toggleExclusion } = useDomainData()

  return (
    <div className="space-y-2">
      {domains.map(domain => (
        <div key={domain.domain} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <span className="font-medium text-muted-foreground">{domain.domain}</span>
          <div className="flex items-center gap-2">
            <ExcludedTriageDropdown domain={domain} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleExclusion(domain.domain, false)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Re-include
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
