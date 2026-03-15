import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Form, redirect, useActionData } from 'react-router'
import type { Route } from './+types/signup'
import {
  createSupabaseServerClient,
  type ServerCookieStore,
} from '~/lib/supabase/server'
import { serializeCookie, type SerializeOptions } from '~/lib/cookie'

function redirectWithCookies(url: string, cookieStore: ServerCookieStore) {
  const res = redirect(url)
  const headers = new Headers(res.headers)
  for (const { name, value, options } of cookieStore.setCookies) {
    headers.append(
      'Set-Cookie',
      serializeCookie(name, value, options as SerializeOptions)
    )
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const username = (formData.get('username') as string)?.trim()

  if (!email || !password || !username) {
    return {
      error: 'メールアドレス、ユーザー名、パスワードを入力してください',
    }
  }

  const cookieStore: ServerCookieStore = { setCookies: [] }
  const supabase = createSupabaseServerClient(request, cookieStore)

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  // サインインしてセッションを取得（public.users 挿入時に auth.uid() を通すため）
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password })

  if (signInError || !signInData.user) {
    // 登録はできているのでログインへ（メール確認必須の場合はここに来る可能性あり）
    return redirect('/login')
  }

  const userId = signInData.user.id

  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    username,
  })

  if (insertError) {
    return { error: 'プロフィールの作成に失敗しました。' + insertError.message }
  }

  // デフォルトルーム（general、なければ先頭のルーム）に参加させる
  const { data: defaultRoom } = await supabase
    .from('rooms')
    .select('id')
    .eq('name', 'general')
    .limit(1)
    .maybeSingle()

  const { data: firstRoom } =
    defaultRoom == null
      ? await supabase.from('rooms').select('id').limit(1).maybeSingle()
      : { data: null }

  const roomId = defaultRoom?.id ?? firstRoom?.id
  if (roomId) {
    await supabase.from('room_members').insert({
      room_id: roomId,
      user_id: userId,
    })
  }

  await new Promise((r) => setTimeout(r, 0))

  return redirectWithCookies('/chat', cookieStore)
}

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const actionData = useActionData<{ error?: string }>()

  return (
    <div className="flex items-center justify-center h-screen">
      <Form method="post" className="flex flex-col gap-4 w-80">
        <h1 className="text-xl font-bold">Sign Up</h1>

        {actionData?.error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
            {actionData.error}
          </p>
        )}

        <input
          name="username"
          type="text"
          placeholder="ユーザー名"
          autoComplete="username"
          className="border p-2 rounded"
        />

        <input
          name="email"
          type="email"
          placeholder="email"
          autoComplete="email"
          className="border p-2 rounded"
        />

        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="password"
            autoComplete="new-password"
            className="border p-2 rounded w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        <button type="submit" className="bg-black text-white p-2 rounded">
          Create account
        </button>
      </Form>
    </div>
  )
}
