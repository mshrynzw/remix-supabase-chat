import { createServerClient } from '@supabase/ssr'
import type { Database } from '~/lib/database.types'
import { parseCookieHeader } from '~/lib/cookie'

export type ServerCookieStore = {
  setCookies: Array<{ name: string; value: string; options: Record<string, unknown> }>
}

function getRequestCookies(request: Request): { name: string; value: string }[] {
  return parseCookieHeader(request.headers.get('Cookie'))
}

export function createSupabaseServerClient(
  request: Request,
  cookieStore?: ServerCookieStore
) {
  const url = process.env.VITE_SUPABASE_URL!
  const key = process.env.VITE_SUPABASE_ANON_KEY!

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return getRequestCookies(request)
      },
      setAll(cookies) {
        if (cookieStore) {
          for (const { name, value, options } of cookies) {
            cookieStore.setCookies.push({ name, value, options: { ...options } })
          }
        }
      },
    },
  })
}
