import { redirect } from 'react-router'
import { createSupabaseServerClient } from '~/lib/supabase/server'

export async function loader() {
  const supabase = createSupabaseServerClient()

  const { data: rooms } = await supabase.from('rooms').select('id').limit(1)

  if (!rooms || rooms.length === 0) {
    throw new Response('No rooms found', { status: 404 })
  }

  return redirect(`/chat/${rooms[0].id}`)
}

export default function ChatRedirect() {
  return null
}
