import { sbServer } from "@/lib/supabase/server"
import { AuthenticatedUser } from "@/lib/auth-middleware"

export class AuthorizationError extends Error {
  resourceType: string

  constructor(resourceType: string) {
    super("Forbidden")
    this.name = "AuthorizationError"
    this.resourceType = resourceType
  }
}

/**
 * Authorization utilities to verify resource ownership
 * Now using Supabase for faster queries
 */

export async function canModifyListing(
  userId: number,
  listingId: number
): Promise<boolean> {
  const supabase = await sbServer()
  const { data: listing } = await supabase
    .from('Listing')
    .select('sellerId')
    .eq('id', listingId)
    .single()
  
  return listing?.sellerId === userId
}

export async function canModifyEvent(
  userId: number,
  eventId: number
): Promise<boolean> {
  const supabase = await sbServer()
  const { data: event } = await supabase
    .from('Event')
    .select('organizerId')
    .eq('id', eventId)
    .single()
  
  return event?.organizerId === userId
}

export async function canAccessConversation(
  userId: number,
  conversationId: number
): Promise<boolean> {
  const supabase = await sbServer()
  const { data: conversation } = await supabase
    .from('Conversation')
    .select('user1Id, user2Id')
    .eq('id', conversationId)
    .single()
  
  if (!conversation) return false
  return conversation.user1Id === userId || conversation.user2Id === userId
}

export async function canModifyMessage(
  userId: number,
  messageId: number
): Promise<boolean> {
  const supabase = await sbServer()
  const { data: message } = await supabase
    .from('Message')
    .select('senderId')
    .eq('id', messageId)
    .single()
  
  return message?.senderId === userId
}

/**
 * Verifies user owns the resource or throws 403
 */
export function assertOwnership(
  isOwner: boolean,
  resourceType: string = "resource"
): void {
  if (!isOwner) {
    throw new AuthorizationError(resourceType)
  }
}

/**
 * Verifies user has access to the resource or throws 403
 */
export function assertAccess(
  hasAccess: boolean,
  resourceType: string = "resource"
): void {
  if (!hasAccess) {
    throw new AuthorizationError(resourceType)
  }
}
