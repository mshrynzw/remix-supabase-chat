import type { Route } from './+types/chat'
import { createSupabaseServerClient } from '~/lib/supabase/server'
import { Form } from 'react-router'

type Room = {
  id: string
  name: string
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chat' },
    { name: 'description', content: 'Realtime chat room' },
  ]
}

export async function loader() {
  const supabase = createSupabaseServerClient()

  const { data: rooms, error } = await supabase.from('rooms').select('*')

  console.log('rooms:', rooms)
  console.log('error:', error)

  return { rooms }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()

  const content = formData.get('content')

  const supabase = createSupabaseServerClient()

  console.log('content:', content)

  const { data, error } = await supabase.from('messages').insert({
    content,
    room_id: 'ef76896a-ec4a-41a5-926a-feb8b9044493',
    user_id: '00000000-0000-0000-0000-000000000000',
  })

  console.log('data:', data)
  console.log('error:', error)

  return null
}

export default function ChatPage({ loaderData }: Route.ComponentProps) {
  const { rooms } = loaderData

  return (
    <div className="flex h-screen">
      {/* ルーム一覧 */}
      <aside className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">Rooms</h2>

        <ul className="space-y-2">
          {rooms?.map((room: Room) => (
            <li key={room.id}># {room.name}</li>
          ))}
        </ul>
      </aside>

      {/* メッセージエリア */}
      <main className="flex flex-1 flex-col">
        {/* メッセージ一覧 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <span className="font-bold">Alice</span>
              <p>Hello 👋</p>
            </div>

            <div>
              <span className="font-bold">Bob</span>
              <p>Hi there</p>
            </div>
          </div>
        </div>

        {/* 入力 */}
        <div className="border-t p-4">
          <Form method="post" className="flex gap-2">
            <input
              name="content"
              className="flex-1 border rounded-lg px-4 py-2"
              placeholder="Type a message..."
            />

            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Send
            </button>
          </Form>
        </div>
      </main>
    </div>
  )
}
