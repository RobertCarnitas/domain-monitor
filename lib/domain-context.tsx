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
  getWebsiteStatusGroups: () => StatusGroup
  getRenewalStatusGroups: () => StatusGroup
}

const DomainContext = createContext<DomainContextType | undefined>(undefined)

const EXCLUSION_STORAGE_KEY = 'domain-monitor-excluded'

function getStoredExclusions(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(EXCLUSION_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveExclusions(exclusions: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(EXCLUSION_STORAGE_KEY, JSON.stringify(Array.from(exclusions)))
  } catch { /* ignore storage errors */ }
}

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [exclusions, setExclusions] = useState<Set<string>>(new Set())

  // Load exclusions from localStorage on mount
  useEffect(() => {
    setExclusions(getStoredExclusions())
  }, [])

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
    // Update local state and localStorage immediately
    setExclusions(prev => {
      const next = new Set(prev)
      if (excluded) {
        next.add(domain)
      } else {
        next.delete(domain)
      }
      saveExclusions(next)
      return next
    })

    // Also try to persist to n8n (best-effort, may fail if column doesn't exist yet)
    try {
      await fetch('/api/exclude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, excluded }),
      })
    } catch {
      // Silently fail - localStorage is the source of truth
    }
  }, [])

  // Apply exclusions to domains
  const domainsWithExclusion = useMemo(() =>
    domains.map(d => ({
      ...d,
      excluded: exclusions.has(d.domain)
    })), [domains, exclusions])

  // Filter by search query
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return domainsWithExclusion
    const q = searchQuery.toLowerCase()
    return domainsWithExclusion.filter(d =>
      d.domain.toLowerCase().includes(q) ||
      d.registrar.toLowerCase().includes(q)
    )
  }, [domainsWithExclusion, searchQuery])

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
        domains: domainsWithExclusion,
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
