import { NextRequest, NextResponse } from "next/server"

/**
 * Simple in-memory rate limiting for API routes
 * For production, consider Redis-based solution
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 300000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// Predefined rate limit tiers
export const RateLimits = {
  STRICT: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
  MODERATE: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  LENIENT: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute
  UPLOAD: { maxRequests: 10, windowMs: 60000 }, // 10 uploads per minute
  AUTH: { maxRequests: 5, windowMs: 300000 }, // 5 auth attempts per 5 minutes
}

/**
 * Rate limit middleware
 * Returns NextResponse with 429 if limit exceeded, null otherwise
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimits.MODERATE
): NextResponse | null {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return null
  }

  if (entry.count >= config.maxRequests) {
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000)
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetInSeconds.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": entry.resetTime.toString(),
        },
      }
    )
  }

  // Increment counter
  entry.count++
  
  return null
}

/**
 * Extract rate limit identifier from request
 * Uses user ID if authenticated, otherwise IP address
 */
export function getRateLimitIdentifier(
  req: NextRequest,
  prefix: string,
  userId?: number
): string {
  if (userId) {
    return `${prefix}:user:${userId}`
  }
  
  // Fall back to IP address
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  
  return `${prefix}:ip:${ip}`
}
