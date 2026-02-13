'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusColor } from '@/lib/types'

interface StatusIndicatorProps {
  color: StatusColor
  count: number
  label: string
  expanded: boolean
  onClick: () => void
}

const colorMap: Record<StatusColor, string> = {
  red: 'bg-destructive hover:bg-destructive/90',
  yellow: 'bg-warning hover:bg-warning/90',
  green: 'bg-success hover:bg-success/90',
  gray: 'bg-muted hover:bg-muted/90'
}

const textColorMap: Record<StatusColor, string> = {
  red: 'text-destructive-foreground',
  yellow: 'text-warning-foreground',
  green: 'text-success-foreground',
  gray: 'text-muted-foreground'
}

export function StatusIndicator({ color, count, label, expanded, onClick }: StatusIndicatorProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-lg transition-all",
        colorMap[color],
        textColorMap[color],
        expanded && "ring-2 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold">{count}</span>
        <span className="font-medium">{label}</span>
      </div>
      <ChevronDown className={cn(
        "h-5 w-5 transition-transform",
        expanded && "rotate-180"
      )} />
    </button>
  )
}
