import type { Route } from './+types/home'
import { Button } from '~/components/ui/button'

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
  return (
    <div className="flex h-screen items-center justify-center">
      <Button>チャットを開始</Button>
    </div>
  )
}
