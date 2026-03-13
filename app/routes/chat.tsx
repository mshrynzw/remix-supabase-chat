import type { Route } from './+types/chat'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chat' },
    { name: 'description', content: 'Realtime chat room' },
  ]
}

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      {/* ルーム一覧 */}
      <aside className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">Rooms</h2>

        <ul className="space-y-2">
          <li># general</li>
          <li># music</li>
          <li># dev</li>
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
          <input
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Type a message..."
          />
        </div>
      </main>
    </div>
  )
}
