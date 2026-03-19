import type { Route } from './+types/chat.$roomId'
import { createSupabaseServerClient } from '~/lib/supabase/server'
import { Form, redirect } from 'react-router'
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
  users: { username: string } | { username: string }[] | null
}

function getMessageUsername(message: Message): string {
  const u = Array.isArray(message.users) ? message.users[0] : message.users
  return u?.username ?? 'user'
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chat' },
    { name: 'description', content: 'Realtime chat room' },
  ]
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const supabase = createSupabaseServerClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 未ログインならログイン画面へ
  if (!user) {
    throw redirect('/login')
  }

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
    rooms: rooms as Room[] | null,
    messages: messages as Message[] | null,
    roomId,
  }
}

const NIL_UUID = '00000000-0000-0000-0000-000000000000'

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()

  const content = formData.get('content') as string

  const supabase = createSupabaseServerClient(request)

  // セッションをクッキーから先に読み込む（SSR の推奨パターン）
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  // Auth サーバーで検証したユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id === NIL_UUID) {
    throw new Error('Not authenticated')
  }

  await supabase.from('messages').insert({
    content,
    room_id: params.roomId,
    user_id: user.id,
  })

  return null
}

export default function ChatPage({ loaderData }: Route.ComponentProps) {
  const { rooms, messages, roomId } = loaderData
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>(
    messages ?? [],
  )
  const formRef = useRef<HTMLFormElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [realtimeMessages])

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
        async (payload: RealtimePostgresInsertPayload<Tables<'messages'>>) => {
          const userId = payload.new.user_id
          let username = 'user'
          if (userId) {
            const { data } = await supabase
              .from('users')
              .select('username')
              .eq('id', userId)
              .maybeSingle()
            if (data?.username) username = data.username
          }
          setRealtimeMessages((prev) => [
            ...prev,
            {
              ...payload.new,
              users: { username },
            },
          ])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return (
    <div className="flex h-screen">
      {/* ルーム一覧 */}
      <aside className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">Rooms</h2>
        <Form method="post" action="/logout">
          <button className="text-sm text-red-500 mb-4">Logout</button>
        </Form>
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
                <span className="font-bold">{getMessageUsername(message)}</span>

                <p>{message.content}</p>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 入力（action を明示して通常の POST にし、クッキーが確実に送信されるようにする） */}
        <div className="border-t p-4">
          <form
            ref={formRef}
            action={`/chat/${roomId}`}
            method="post"
            className="flex gap-2"
          >
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
          </form>
        </div>
      </main>
    </div>
  )
}
