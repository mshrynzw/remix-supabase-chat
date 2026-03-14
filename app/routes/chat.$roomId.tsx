import type { Route } from './+types/chat'
import { createSupabaseServerClient } from '~/lib/supabase/server'
import { Form, useNavigation } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import type { Tables } from '~/lib/database.types'
import { createSupabaseBrowserClient } from '~/lib/supabase/browser'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { Link } from 'react-router'

type Room = {
  id: string
  name: string
}

type Message = Pick<Tables<'messages'>, 'id' | 'content' | 'created_at'> & {
  users: { username: string }[] | null
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chat' },
    { name: 'description', content: 'Realtime chat room' },
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  const supabase = createSupabaseServerClient()

  const roomId = params.roomId

  const { data: rooms } = await supabase.from('rooms').select('*')

  const { data: messages } = await supabase
    .from('messages')
    .select(
      `
      id,
      content,
      created_at,
      users (
        username
      )
    `,
    )
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  return {
    rooms,
    messages: messages as Message[] | null,
    roomId,
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()

  const content = formData.get('content') as string

  const supabase = createSupabaseServerClient()

  console.log('content:', content)

  const { data, error } = await supabase.from('messages').insert({
    content,
    room_id: params.roomId,
    user_id: '00000000-0000-0000-0000-000000000000',
  })

  console.log('data:', data)
  console.log('error:', error)

  return null
}

export default function ChatPage({ loaderData }: Route.ComponentProps) {
  const { rooms, messages, roomId } = loaderData
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>(
    messages ?? [],
  )
  const formRef = useRef<HTMLFormElement>(null)
  const navigation = useNavigation()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresInsertPayload<Tables<'messages'>>) => {
          setRealtimeMessages((prev) => [
            ...prev,
            {
              ...payload.new,
              users: [{ username: 'user' }],
            },
          ])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  useEffect(() => {
    if (navigation.state === 'idle') {
      formRef.current?.reset()
    }
  }, [navigation.state])

  useEffect(() => {
    if (navigation.state === 'idle') {
      formRef.current?.reset()
      formRef.current?.querySelector('input')?.focus()
    }
  }, [navigation.state])

  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="flex h-screen">
      {/* ルーム一覧 */}
      <aside className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">Rooms</h2>

        <ul className="space-y-2">
          {rooms?.map((room: Room) => (
            <li key={room.id}>
              <Link to={`/chat/${room.id}`}># {room.name}</Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* メッセージエリア */}
      <main className="flex flex-1 flex-col">
        {/* メッセージ一覧 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {realtimeMessages?.map((message: Message) => (
              <div key={message.id}>
                <span className="font-bold">
                  {message.users?.[0]?.username ?? 'user'}
                </span>

                <p>{message.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 入力 */}
        <div className="border-t p-4">
          <Form ref={formRef} method="post" className="flex gap-2">
            <input
              name="content"
              className="flex-1 border rounded-lg px-4 py-2"
              placeholder="Type a message..."
            />

            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </Form>
        </div>
      </main>
    </div>
  )
}
