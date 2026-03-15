import { Form, redirect } from 'react-router'
import type { Route } from './+types/signup'
import { createSupabaseServerClient } from '~/lib/supabase/server'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return redirect('/login')
}

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Form method="post" className="flex flex-col gap-4 w-80">
        <h1 className="text-xl font-bold">Sign Up</h1>

        <input
          name="email"
          type="email"
          placeholder="email"
          className="border p-2 rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="password"
          className="border p-2 rounded"
        />

        <button type="submit" className="bg-black text-white p-2 rounded">
          Create account
        </button>
      </Form>
    </div>
  )
}
