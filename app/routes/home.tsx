import type { Route } from './+types/home'
import { useEffect } from 'react'
import { supabase } from '~/lib/supabase/client'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Supabase Chat App' },
    {
      name: 'description',
      content: 'Realtime chat with Supabase and React Router',
    },
  ]
}

export default function Home() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('rooms').select('*')

      console.log('rooms', data)
      console.log('error', error)
    }

    test()
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-2xl">Supabase connection test</h1>
    </div>
  )
}
