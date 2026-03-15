import { redirect } from 'react-router'
import { createSupabaseServerClient } from '~/lib/supabase/server'
import type { Route } from './+types/logout'

export async function action({ request }: Route.ActionArgs) {
  const supabase = createSupabaseServerClient(request)

  await supabase.auth.signOut()

  return redirect('/login')
}

export default function Logout() {
  return null
}
