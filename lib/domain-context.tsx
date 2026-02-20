'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { Domain, StatusGroup } from './types'

interface DomainContextType {
  domains: Domain[]
  filteredDomains: Domain[]
  excludedDomains: Domain[]
  loading: boolean
  error: string | null
  lastSynced: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  refetch: () => Promise<void>
  triggerSync: () => Promise<void>
  syncing: boolean
  toggleExclusion: (domain: string, excluded: boolean) => Promise<void>
  setTriageStatus: (domain: string, status: '' | 'investigating' | 'resolved' | 'non-issue') => Promise<void>
  getWebsiteStatusGroups: () => StatusGroup
  getRenewalStatusGroups: () => StatusGroup
}

const DomainContext = createContext<DomainContextType | undefined>(undefined)

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/domains')
      if (!response.ok) {
        throw new Error('Failed to fetch domains')
      }
      const data = await response.json()
      setDomains(data.domains || [])
      if (data.lastSynced) {
        setLastSynced(data.lastSynced)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    try {
      setSyncing(true)
      setError(null)
      const response = await fetch('/api/sync', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to trigger sync')
      }
      await fetchDomains()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [fetchDomains])

  const toggleExclusion = useCallback(async (domain: string, excluded: boolean) => {
    // Find the domain's current triageStatus to send along
    const domainData = domains.find(d => d.domain === domain)
    const triageStatus = domainData?.triageStatus || ''

    // Optimistically update local state from n8n data
    setDomains(prev =>
      prev.map(d =>
        d.domain === domain ? { ...d, excluded } : d
      )
    )

    // Persist to n8n data table (server is the source of truth)
    // The n8n workflow encodes exclusion into triageStatus field
    try {
      await fetch('/api/exclude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, excluded, triageStatus }),
      })
    } catch {
      // Revert optimistic update on failure
      setDomains(prev =>
        prev.map(d =>
          d.domain === domain ? { ...d, excluded: !excluded } : d
        )
      )
    }
  }, [domains])

  const setTriageStatus = useCallback(async (domain: string, status: '' | 'investigating' | 'resolved' | 'non-issue') => {
    // Optimistically update local state
    setDomains(prev =>
      prev.map(d =>
        d.domain === domain ? { ...d, triageStatus: status } : d
      )
    )

    // Persist to n8n data table
    try {
      await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, triageStatus: status }),
      })
    } catch {
      // Silently fail - optimistic update stays in place until next refetch
    }
  }, [])

  // Filter by search query (exclusion comes from n8n data directly)
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return domains
    const q = searchQuery.toLowerCase()
    return domains.filter(d =>
      d.domain.toLowerCase().includes(q) ||
      d.registrar.toLowerCase().includes(q)
    )
  }, [domains, searchQuery])

  // Split into active (non-excluded) and excluded
  const filteredDomains = useMemo(() =>
    searchFiltered.filter(d => !d.excluded), [searchFiltered])

  const excludedDomains = useMemo(() =>
    searchFiltered.filter(d => d.excluded), [searchFiltered])

  const getWebsiteStatusGroups = useCallback((): StatusGroup => {
    return {
      critical: filteredDomains.filter(d => d.statusCategory === 'down'),
      warning: filteredDomains.filter(d => d.statusCategory === 'redirect'),
      healthy: filteredDomains.filter(d => d.statusCategory === 'healthy'),
      unchecked: filteredDomains.filter(d => d.statusCategory === 'unchecked')
    }
  }, [filteredDomains])

  const getRenewalStatusGroups = useCallback((): StatusGroup => {
    return {
      critical: filteredDomains.filter(d => d.renewalStatus === 'expired'),
      warning: filteredDomains.filter(d => d.renewalStatus === 'warning'),
      healthy: filteredDomains.filter(d => d.renewalStatus === 'healthy'),
      unchecked: filteredDomains.filter(d => d.renewalStatus === 'unknown')
    }
  }, [filteredDomains])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  return (
    <DomainContext.Provider
      value={{
        domains,
        filteredDomains,
        excludedDomains,
        loading,
        error,
        lastSynced,
        searchQuery,
        setSearchQuery,
        refetch: fetchDomains,
        triggerSync,
        syncing,
        toggleExclusion,
        setTriageStatus,
        getWebsiteStatusGroups,
        getRenewalStatusGroups
      }}
    >
      {children}
    </DomainContext.Provider>
  )
}

export function useDomainData() {
  const context = useContext(DomainContext)
  if (context === undefined) {
    throw new Error('useDomainData must be used within a DomainProvider')
  }
  return context
}
