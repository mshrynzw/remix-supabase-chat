/**
 * Cookie ヘッダーをパースして { name, value }[] を返す
 */
export function parseCookieHeader(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader) return []
  return cookieHeader.split(';').map((part) => {
    const [name, ...valueParts] = part.trim().split('=')
    const value = valueParts.join('=').trim()
    return { name: name?.trim() ?? '', value: value || '' }
  })
}

export type SerializeOptions = {
  path?: string
  maxAge?: number
  sameSite?: 'lax' | 'strict' | 'none'
  httpOnly?: boolean
  secure?: boolean
}

/**
 * Set-Cookie ヘッダー用の文字列を生成
 */
export function serializeCookie(
  name: string,
  value: string,
  options: SerializeOptions = {}
): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]
  if (options.path != null) parts.push(`Path=${options.path}`)
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`)
  if (options.sameSite != null) parts.push(`SameSite=${options.sameSite}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  return parts.join('; ')
}
