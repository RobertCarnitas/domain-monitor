import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be configured')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

export interface SupabaseDomain {
  id: number
  domain: string
  cloudflare_zone_id: string
  name_servers: string | null
  registrar: string | null
  expiration_date: string | null
  created_date: string | null
  http_status: number | null
  last_checked: string | null
  created_at: string
  updated_at: string
}
