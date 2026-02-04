'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Domain, StatusGroup } from './types'

interface DomainContextType {
  domains: Domain[]
  loading: boolean
  error: string | null
  lastSynced: string | null
  refetch: () => Promise<void>
  triggerSync: () => Promise<void>
  syncing: boolean
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

  const getWebsiteStatusGroups = useCallback((): StatusGroup => {
    return {
      critical: domains.filter(d => d.statusCategory === 'down'),
      warning: domains.filter(d => d.statusCategory === 'redirect'),
      healthy: domains.filter(d => d.statusCategory === 'healthy')
    }
  }, [domains])

  const getRenewalStatusGroups = useCallback((): StatusGroup => {
    return {
      critical: domains.filter(d => d.renewalStatus === 'expired'),
      warning: domains.filter(d => d.renewalStatus === 'warning'),
      healthy: domains.filter(d => d.renewalStatus === 'healthy' || d.renewalStatus === 'unknown')
    }
  }, [domains])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  return (
    <DomainContext.Provider
      value={{
        domains,
        loading,
        error,
        lastSynced,
        refetch: fetchDomains,
        triggerSync,
        syncing,
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
