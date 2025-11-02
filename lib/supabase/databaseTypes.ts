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