/**
 * Supabase Database Types
 * Generated from Prisma schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Profile: {
        Row: {
          id: number
          supabaseId: string | null
          name: string | null
          avatarUrl: string | null
          createdAt: string
          updatedAt: string
          year: string | null
          major: string | null
          bio: string | null
          phone: string | null
          campusArea: string | null
          isVerified: boolean
          verifiedEmail: string | null
          role: 'user' | 'admin' | 'moderator'
          isAdmin: boolean
          isSuspended: boolean
          suspendedUntil: string | null
          suspensionReason: string | null
        }
        Insert: {
          id?: number
          supabaseId?: string | null
          name?: string | null
          avatarUrl?: string | null
          createdAt?: string
          updatedAt?: string
          year?: string | null
          major?: string | null
          bio?: string | null
          phone?: string | null
          campusArea?: string | null
          isVerified?: boolean
          verifiedEmail?: string | null
          role?: 'user' | 'admin' | 'moderator'
          isAdmin?: boolean
          isSuspended?: boolean
          suspendedUntil?: string | null
          suspensionReason?: string | null
        }
        Update: {
          id?: number
          supabaseId?: string | null
          name?: string | null
          avatarUrl?: string | null
          createdAt?: string
          updatedAt?: string
          year?: string | null
          major?: string | null
          bio?: string | null
          phone?: string | null
          campusArea?: string | null
          isVerified?: boolean
          verifiedEmail?: string | null
          role?: 'user' | 'admin' | 'moderator'
          isAdmin?: boolean
          isSuspended?: boolean
          suspendedUntil?: string | null
          suspensionReason?: string | null
        }
      }
      Category: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
      }
      Listing: {
        Row: {
          id: number
          title: string
          description: string
          priceCents: number
          condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'
          imageUrl: string | null
          images: string[]
          imageCount: number
          campus: string | null
          isSold: boolean
          sellerId: number
          categoryId: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          title: string
          description: string
          priceCents: number
          condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'
          imageUrl?: string | null
          images?: string[]
          imageCount?: number
          campus?: string | null
          isSold?: boolean
          sellerId: number
          categoryId?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          priceCents?: number
          condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'
          imageUrl?: string | null
          images?: string[]
          imageCount?: number
          campus?: string | null
          isSold?: boolean
          sellerId?: number
          categoryId?: number | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Conversation: {
        Row: {
          id: number
          user1Id: number
          user2Id: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          user1Id: number
          user2Id: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          user1Id?: number
          user2Id?: number
          createdAt?: string
          updatedAt?: string
        }
      }
      Message: {
        Row: {
          id: number
          conversationId: number
          senderId: number
          receiverId: number
          content: string
          isRead: boolean
          createdAt: string
          messageType: 'TEXT' | 'PHOTO' | 'VOICE'
          mediaUrl: string | null
        }
        Insert: {
          id?: number
          conversationId: number
          senderId: number
          receiverId: number
          content: string
          isRead?: boolean
          createdAt?: string
          messageType?: 'TEXT' | 'PHOTO' | 'VOICE'
          mediaUrl?: string | null
        }
        Update: {
          id?: number
          conversationId?: number
          senderId?: number
          receiverId?: number
          content?: string
          isRead?: boolean
          createdAt?: string
          messageType?: 'TEXT' | 'PHOTO' | 'VOICE'
          mediaUrl?: string | null
        }
      }
      Event: {
        Row: {
          id: number
          title: string
          description: string
          eventDate: string
          startTime: string
          endTime: string | null
          location: string
          imageUrl: string | null
          capacity: number | null
          category: string | null
          organizerId: number
          isExternal: boolean
          externalSource: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          title: string
          description: string
          eventDate: string
          startTime: string
          endTime?: string | null
          location: string
          imageUrl?: string | null
          capacity?: number | null
          category?: string | null
          organizerId: number
          isExternal?: boolean
          externalSource?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          eventDate?: string
          startTime?: string
          endTime?: string | null
          location?: string
          imageUrl?: string | null
          capacity?: number | null
          category?: string | null
          organizerId?: number
          isExternal?: boolean
          externalSource?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      EventAttendee: {
        Row: {
          id: number
          eventId: number
          userId: number
          createdAt: string
        }
        Insert: {
          id?: number
          eventId: number
          userId: number
          createdAt?: string
        }
        Update: {
          id?: number
          eventId?: number
          userId?: number
          createdAt?: string
        }
      }
      ProhibitedItem: {
        Row: {
          id: number
          type: 'keyword' | 'regex' | 'category' | 'url_pattern'
          pattern: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          action: 'flag' | 'auto_reject' | 'warn'
          category: string | null
          description: string | null
          isActive: boolean
          createdBy: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          type: 'keyword' | 'regex' | 'category' | 'url_pattern'
          pattern: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          action?: 'flag' | 'auto_reject' | 'warn'
          category?: string | null
          description?: string | null
          isActive?: boolean
          createdBy?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          type?: 'keyword' | 'regex' | 'category' | 'url_pattern'
          pattern?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          action?: 'flag' | 'auto_reject' | 'warn'
          category?: string | null
          description?: string | null
          isActive?: boolean
          createdBy?: number | null
          createdAt?: string
          updatedAt?: string
        }
      }
      FlaggedContent: {
        Row: {
          id: number
          contentType: 'listing' | 'message' | 'profile' | 'event'
          contentId: number
          userId: number
          reason: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'pending' | 'approved' | 'rejected' | 'deleted'
          source: 'auto' | 'user_report' | 'admin'
          details: Json | null
          reviewedBy: number | null
          reviewedAt: string | null
          reviewNotes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          contentType: 'listing' | 'message' | 'profile' | 'event'
          contentId: number
          userId: number
          reason: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'approved' | 'rejected' | 'deleted'
          source?: 'auto' | 'user_report' | 'admin'
          details?: Json | null
          reviewedBy?: number | null
          reviewedAt?: string | null
          reviewNotes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          contentType?: 'listing' | 'message' | 'profile' | 'event'
          contentId?: number
          userId?: number
          reason?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'approved' | 'rejected' | 'deleted'
          source?: 'auto' | 'user_report' | 'admin'
          details?: Json | null
          reviewedBy?: number | null
          reviewedAt?: string | null
          reviewNotes?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      UserStrike: {
        Row: {
          id: number
          userId: number
          reason: string
          severity: 'minor' | 'major' | 'severe'
          flaggedContentId: number | null
          issuedBy: number | null
          notes: string | null
          isActive: boolean
          createdAt: string
        }
        Insert: {
          id?: number
          userId: number
          reason: string
          severity?: 'minor' | 'major' | 'severe'
          flaggedContentId?: number | null
          issuedBy?: number | null
          notes?: string | null
          isActive?: boolean
          createdAt?: string
        }
        Update: {
          id?: number
          userId?: number
          reason?: string
          severity?: 'minor' | 'major' | 'severe'
          flaggedContentId?: number | null
          issuedBy?: number | null
          notes?: string | null
          isActive?: boolean
          createdAt?: string
        }
      }
      ModerationLog: {
        Row: {
          id: number
          adminId: number
          action: string
          targetType: string
          targetId: number
          details: Json | null
          createdAt: string
        }
        Insert: {
          id?: number
          adminId: number
          action: string
          targetType: string
          targetId: number
          details?: Json | null
          createdAt?: string
        }
        Update: {
          id?: number
          adminId?: number
          action?: string
          targetType?: string
          targetId?: number
          details?: Json | null
          createdAt?: string
        }
      }
      UserReport: {
        Row: {
          id: number
          reporterId: number
          contentType: 'listing' | 'message' | 'profile' | 'event'
          contentId: number
          category: string
          description: string | null
          status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
          flaggedContentId: number | null
          resolvedBy: number | null
          resolvedAt: string | null
          resolution: string | null
          createdAt: string
        }
        Insert: {
          id?: number
          reporterId: number
          contentType: 'listing' | 'message' | 'profile' | 'event'
          contentId: number
          category: string
          description?: string | null
          status?: 'pending' | 'investigating' | 'resolved' | 'dismissed'
          flaggedContentId?: number | null
          resolvedBy?: number | null
          resolvedAt?: string | null
          resolution?: string | null
          createdAt?: string
        }
        Update: {
          id?: number
          reporterId?: number
          contentType?: 'listing' | 'message' | 'profile' | 'event'
          contentId?: number
          category?: string
          description?: string | null
          status?: 'pending' | 'investigating' | 'resolved' | 'dismissed'
          flaggedContentId?: number | null
          resolvedBy?: number | null
          resolvedAt?: string | null
          resolution?: string | null
          createdAt?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      Condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'
      MessageType: 'TEXT' | 'PHOTO' | 'VOICE'
    }
  }
}

export const databaseSchema = {} as Database