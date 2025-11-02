import type { User as SupabaseUser } from '@supabase/supabase-js'
import { sbServer } from './supabase/server'
import type { Database } from './supabase/databaseTypes'

type ProfileRow = Database['public']['Tables']['Profile']['Row']

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
  | { supabaseUser: SupabaseUser; profile: ProfileRow }
  | { supabaseUser: null; profile: null }
> {
  const supabase = await sbServer()
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

  const { data: existingProfile, error: fetchError } = await supabase
    .from('Profile')
    .select('*')
    .eq('supabaseId', supabaseUser.id)
    .maybeSingle()

  if (fetchError) {
    console.error('Failed to load profile:', fetchError)
    throw fetchError
  }

  const desiredName = name ?? 'Anonymous User'

  if (existingProfile) {
    const updates: Partial<ProfileRow> = {}
    if (existingProfile.name !== desiredName) {
      updates.name = desiredName
    }
    if (existingProfile.avatarUrl !== avatarUrl) {
      updates.avatarUrl = avatarUrl
    }
    if (Object.keys(updates).length === 0) {
      return { supabaseUser, profile: existingProfile }
    }

    updates.updatedAt = new Date().toISOString()

    const { data: updatedProfile, error: updateError } = await supabase
      .from('Profile')
      .update(updates)
      .eq('id', existingProfile.id)
      .select()
      .single()

    if (updateError || !updatedProfile) {
      console.error('Failed to update profile:', updateError)
      throw updateError
    }

    return { supabaseUser, profile: updatedProfile }
  }

  const insertPayload = {
    supabaseId: supabaseUser.id,
    name: desiredName,
    avatarUrl,
  }

  const { data: insertedProfile, error: insertError } = await supabase
    .from('Profile')
    .insert(insertPayload)
    .select()
    .single()

  if (insertError || !insertedProfile) {
    console.error('Failed to create profile:', insertError)
    throw insertError
  }

  return { supabaseUser, profile: insertedProfile }
}