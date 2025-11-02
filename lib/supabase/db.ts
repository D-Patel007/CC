import { createClient } from '@supabase/supabase-js'
import { Database } from './databaseTypes'

/**
 * Server-side Supabase client with service role (bypasses RLS)
 * Use this ONLY in API routes where you need admin access
 * For user-specific queries, use sbServer() from ./server.ts
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Type-safe table names
 */
export const Tables = {
  Profile: 'Profile' as const,
  Listing: 'Listing' as const,
  Event: 'Event' as const,
  EventAttendee: 'EventAttendee' as const,
  Conversation: 'Conversation' as const,
  Message: 'Message' as const,
  Category: 'Category' as const,
}

/**
 * Helper types for common queries
 */
export type ListingWithRelations = Database['public']['Tables']['Listing']['Row'] & {
  seller?: Database['public']['Tables']['Profile']['Row']
  category?: Database['public']['Tables']['Category']['Row']
}

export type EventWithRelations = Database['public']['Tables']['Event']['Row'] & {
  organizer?: Database['public']['Tables']['Profile']['Row']
  attendees?: Array<{
    user: Database['public']['Tables']['Profile']['Row']
  }>
}

export type ConversationWithRelations = Database['public']['Tables']['Conversation']['Row'] & {
  user1?: Database['public']['Tables']['Profile']['Row']
  user2?: Database['public']['Tables']['Profile']['Row']
  messages?: Database['public']['Tables']['Message']['Row'][]
}

export type MessageWithRelations = Database['public']['Tables']['Message']['Row'] & {
  sender?: Database['public']['Tables']['Profile']['Row']
}
