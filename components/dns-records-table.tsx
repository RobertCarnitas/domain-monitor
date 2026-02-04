'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { DNSRecord } from '@/lib/types'

interface DNSRecordsTableProps {
  records: DNSRecord[]
  loading?: boolean
}

export function DNSRecordsTable({ records, loading }: DNSRecordsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No DNS records found
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-sm">Type</th>
            <th className="text-left p-3 font-medium text-sm">Name</th>
            <th className="text-left p-3 font-medium text-sm">Value</th>
            <th className="text-left p-3 font-medium text-sm">TTL</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={`${record.type}-${record.name}-${index}`} className="border-b hover:bg-muted/50">
              <td className="p-3">
                <Badge variant="outline" className="font-mono text-xs">
                  {record.type}
                </Badge>
              </td>
              <td className="p-3 font-mono text-sm">{record.name}</td>
              <td className="p-3 font-mono text-sm max-w-md">
                <span className="break-all">{record.value}</span>
              </td>
              <td className="p-3 text-muted-foreground text-sm">{record.ttl}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
