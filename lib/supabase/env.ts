/**
 * Clean Supabase environment variables by trimming whitespace and
 * removing any CRLF (\r\n / %0D%0A) characters that may have been
 * accidentally included during environment variable configuration.
 */
export function getSupabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eobatkwbwcdsdqbemrma.supabase.co')
    .trim()
    .replace(/[\r\n]+/g, '');

  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
  )
    .trim()
    .replace(/[\r\n]+/g, '');

  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    .trim()
    .replace(/[\r\n]+/g, '');

  return { url, anonKey, serviceRoleKey };
}
