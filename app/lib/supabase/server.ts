import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/lib/database.types'

export function createSupabaseServerClient() {
  return createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
  )
}
