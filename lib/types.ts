export interface Domain {
  id: string
  domain: string
  httpStatus: number
  statusCategory: 'healthy' | 'redirect' | 'down' | 'unchecked'
  registrar: string
  nameServers: string
  expirationDate: string | null
  createdDate: string | null
  lastChecked: string
  cloudflareZoneId: string
  renewalStatus: 'healthy' | 'warning' | 'expired' | 'unknown'
  daysUntilExpiration: number | null
  excluded: boolean
  redirectTo: string
}

export interface DNSRecord {
  type: string
  name: string
  value: string
  ttl: number
}

export interface StatusCheck {
  id: string
  domain: string
  httpStatus: number
  responseTime: number
  checkedAt: string
  errorMessage: string | null
}

export interface SyncResult {
  success: boolean
  domainsProcessed: number
  domainsUpdated: number
  errors: string[]
}

export type StatusColor = 'red' | 'yellow' | 'green' | 'gray'

export interface StatusGroup {
  critical: Domain[]
  warning: Domain[]
  healthy: Domain[]
  unchecked: Domain[]
}
