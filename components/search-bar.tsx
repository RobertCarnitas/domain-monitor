'use client'

import { Search, X } from 'lucide-react'
import { useDomainData } from '@/lib/domain-context'

export function SearchBar() {
  const { searchQuery, setSearchQuery, domains, filteredDomains, excludedDomains } = useDomainData()
  const totalShown = filteredDomains.length + excludedDomains.length

  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search domains..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-10 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {searchQuery && (
        <p className="text-xs text-muted-foreground mt-1">
          Showing {totalShown} of {domains.length} domains
        </p>
      )}
    </div>
  )
}
