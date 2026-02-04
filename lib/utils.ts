import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getStatusExplanation(status: number): string {
  if (status === 200) return 'Website is responding normally'
  if (status === 301) return 'Permanent redirect configured'
  if (status === 302) return 'Temporary redirect in place'
  if (status === 403) return 'Access forbidden'
  if (status === 404) return 'Page not found'
  if (status === 500) return 'Server error'
  if (status === 502) return 'Bad gateway'
  if (status === 503) return 'Service unavailable'
  if (status === 0) return 'Connection failed'
  return `HTTP ${status} response`
}

export function getDaysUntilExpiration(expirationDate: string | null): number | null {
  if (!expirationDate) return null
  const now = new Date()
  const expDate = new Date(expirationDate)
  const diffTime = expDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
