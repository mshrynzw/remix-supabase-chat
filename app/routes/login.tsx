import { Form, redirect, useActionData } from 'react-router'
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

        <input
          name="password"
          type="password"
          placeholder="password"
          autoComplete="current-password"
          className="border p-2 rounded"
        />

        <button type="submit" className="bg-black text-white p-2 rounded">
          Login
        </button>
      </Form>
    </div>
  )
}
