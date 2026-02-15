'use client'

import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDomainData } from '@/lib/domain-context'
import type { Domain } from '@/lib/types'

export function ExcludedDomainList({ domains }: { domains: Domain[] }) {
  const { toggleExclusion } = useDomainData()

  return (
    <div className="space-y-2">
      {domains.map(domain => (
        <div key={domain.domain} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <span className="font-medium text-muted-foreground">{domain.domain}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleExclusion(domain.domain, false)}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Re-include
          </Button>
        </div>
      ))}
    </div>
  )
}
