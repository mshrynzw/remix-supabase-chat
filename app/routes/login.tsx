import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Form, Link, redirect, useActionData } from 'react-router'
import type { Route } from './+types/login'
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
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email?.trim() || !password) {
    return { error: 'メールアドレスとパスワードを入力してください' }
  }

  const cookieStore: ServerCookieStore = { setCookies: [] }
  const supabase = createSupabaseServerClient(request, cookieStore)

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  // セッションがクッキーに書き込まれるのを待つ（onAuthStateChange が非同期のため）
  await new Promise((r) => setTimeout(r, 0))

  return redirectWithCookies('/chat', cookieStore)
}

export default function LoginPage() {
  const actionData = useActionData<{ error?: string }>()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex items-center justify-center h-screen">
      <Form method="post" className="flex flex-col gap-4 w-80">
        <h1 className="text-xl font-bold">Login</h1>

        {actionData?.error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
            {actionData.error}
          </p>
        )}

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
            autoComplete="current-password"
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
          Login
        </button>

        <p className="text-sm text-center text-gray-600">
          アカウントをお持ちでない方は
          <Link to="/signup" className="text-black font-medium underline ml-1">
            新規登録
          </Link>
        </p>
      </Form>
    </div>
  )
}
