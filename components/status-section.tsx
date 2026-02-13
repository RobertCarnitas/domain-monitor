'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusIndicator } from '@/components/status-indicator'
import { DomainList } from '@/components/domain-list'
import { useDomainData } from '@/lib/domain-context'

interface StatusSectionProps {
  title: string
  type: 'website' | 'renewal'
}

export function StatusSection({ title, type }: StatusSectionProps) {
  const [expandedStatus, setExpandedStatus] = useState<'critical' | 'warning' | 'healthy' | 'unchecked' | null>(null)
  const { getWebsiteStatusGroups, getRenewalStatusGroups } = useDomainData()

  const statusGroups = useMemo(() => {
    return type === 'website' ? getWebsiteStatusGroups() : getRenewalStatusGroups()
  }, [type, getWebsiteStatusGroups, getRenewalStatusGroups])

  const toggleExpanded = (status: 'critical' | 'warning' | 'healthy' | 'unchecked') => {
    setExpandedStatus(expandedStatus === status ? null : status)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusIndicator
          color="red"
          count={statusGroups.critical.length}
          label={type === 'website' ? 'Site Down' : 'Expired'}
          expanded={expandedStatus === 'critical'}
          onClick={() => toggleExpanded('critical')}
        />
        {expandedStatus === 'critical' && (
          <DomainList domains={statusGroups.critical} type={type} />
        )}

        <StatusIndicator
          color="yellow"
          count={statusGroups.warning.length}
          label={type === 'website' ? 'Redirects' : 'Expiring Soon'}
          expanded={expandedStatus === 'warning'}
          onClick={() => toggleExpanded('warning')}
        />
        {expandedStatus === 'warning' && (
          <DomainList domains={statusGroups.warning} type={type} />
        )}

        <StatusIndicator
          color="green"
          count={statusGroups.healthy.length}
          label="Healthy"
          expanded={expandedStatus === 'healthy'}
          onClick={() => toggleExpanded('healthy')}
        />
        {expandedStatus === 'healthy' && (
          <DomainList domains={statusGroups.healthy} type={type} />
        )}

        {statusGroups.unchecked.length > 0 && (
          <>
            <StatusIndicator
              color="gray"
              count={statusGroups.unchecked.length}
              label={type === 'website' ? 'Not Yet Checked' : 'Unknown Expiration'}
              expanded={expandedStatus === 'unchecked'}
              onClick={() => toggleExpanded('unchecked')}
            />
            {expandedStatus === 'unchecked' && (
              <DomainList domains={statusGroups.unchecked} type={type} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
