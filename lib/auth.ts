import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@prisma/client'
import { prisma } from './db'
import { sbServer } from './supabase/server'

function deriveName(user: SupabaseUser): string | null {
  const metadata = user.user_metadata || {}
  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
    (typeof metadata.name === 'string' && metadata.name.trim()) ||
    null

  if (name) return name
  if (user.email) return user.email.split('@')[0]
  return null
}

export async function getCurrentUser(): Promise<
  | { supabaseUser: SupabaseUser; profile: User }
  | { supabaseUser: null; profile: null }
> {
  const supabase = sbServer()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Supabase auth getUser error:', error)
    return { supabaseUser: null, profile: null }
  }

  const supabaseUser = data.user
  if (!supabaseUser) {
    return { supabaseUser: null, profile: null }
  }

  const email = supabaseUser.email ?? null
  const avatarUrl =
    (typeof supabaseUser.user_metadata?.avatar_url === 'string' &&
      supabaseUser.user_metadata.avatar_url) || null
  const name = deriveName(supabaseUser)

  const profile = await prisma.user.upsert({
    where: { supabaseId: supabaseUser.id },
    update: { email, name: name ?? undefined, avatarUrl },
    create: {
      supabaseId: supabaseUser.id,
      email,
      name,
      avatarUrl,
    },
  })

  return { supabaseUser, profile }
}
