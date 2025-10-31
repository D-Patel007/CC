# Security Implementation Guide for Campus Connect

## ✅ Implemented Security Features

### 1. Authentication & Authorization
- ✅ Supabase Authentication with magic links
- ✅ Server-side session validation using `getCurrentUser()`
- ✅ All protected API routes check authentication
- ✅ Profile-based user identification and authorization

### 2. Input Validation & Sanitization
- ✅ Created `lib/validation.ts` with comprehensive validation utilities
- ✅ String sanitization with length limits
- ✅ Integer validation with min/max bounds
- ✅ Date validation
- ✅ Email validation
- ✅ HTML escaping to prevent XSS
- ✅ Filename sanitization to prevent path traversal

### 3. File Upload Security
- ✅ Authentication required for all uploads
- ✅ File type validation (images: JPEG, PNG, GIF, WebP; audio: WebM, MP3, WAV, OGG)
- ✅ File size limits (images: 5MB, audio: 10MB)
- ✅ Secure filename generation (prevents path traversal)
- ✅ Rate limiting (10 uploads per minute per user)
- ✅ Files scoped to user ID in filename

### 4. Rate Limiting
- ✅ In-memory rate limiting implementation
- ✅ Upload endpoint: 10 uploads/minute per user
- ✅ Event creation: 5 events/hour per user
- ✅ Automatic cleanup of expired rate limit records

### 5. API Security
- ✅ Event creation validates:
  - Required fields presence
  - String lengths (title: 200, description: 2000, location: 300)
  - Date is in the future
  - Time format (HH:MM)
  - Capacity range (1-10000)
  - Category whitelist
- ✅ Proper error messages without leaking system details
- ✅ HTTPS enforced in production (Vercel default)

## 🔄 Additional Recommended Security Measures

### 1. Row Level Security (RLS) Policies for Supabase

Since you're using Supabase, you should implement RLS policies on your Storage bucket:

```sql
-- Storage Policies for message-media bucket

-- Policy: Users can only read their own files or public files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-media' AND
  (storage.foldername(name))[1] IN ('photos', 'voices', 'listings') AND
  auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- Policy: Users can upload files
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media' AND
  (storage.foldername(name))[1] IN ('photos', 'voices', 'listings') AND
  auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-media' AND
  auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);
```

### 2. Database Authorization Checks

Add authorization checks to ensure users can only:
- Edit their own listings
- Delete their own listings
- Edit their own events
- Delete their own events
- Only see conversations they're part of
- Only send messages in their own conversations

### 3. Content Security Policy (CSP)

Add to `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### 4. Environment Variables

Ensure all sensitive data is in environment variables:
- ✅ DATABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY (if used)

### 5. CORS Configuration

Ensure CORS is properly configured in production to only allow your domain.

### 6. Dependency Security

Run regularly:
```bash
npm audit
npm audit fix
```

### 7. Prisma Security

- ✅ Using parameterized queries (Prisma handles this)
- ✅ No raw SQL queries that could lead to injection
- ⚠️ Consider adding database-level constraints

## 🔒 Database Constraints to Add

Add these constraints in Prisma schema:

```prisma
model Event {
  // ... existing fields
  
  @@index([organizerId])
  @@index([eventDate])
}

model EventAttendee {
  // ... existing fields
  
  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
}

model Message {
  // ... existing fields
  
  @@index([conversationId])
  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
}
```

## 🛡️ Security Checklist

- [x] Authentication on all protected routes
- [x] Input validation on all POST/PATCH/PUT requests
- [x] File upload validation (type, size)
- [x] Rate limiting on critical endpoints
- [x] Secure filename generation
- [x] SQL injection protection (via Prisma)
- [x] XSS prevention (input sanitization)
- [ ] RLS policies on Supabase Storage
- [ ] Authorization checks for edit/delete operations
- [ ] Content Security Policy headers
- [ ] Regular dependency audits
- [ ] Error logging without exposing sensitive data

## 📝 Next Steps for Production

1. **Implement RLS Policies**: Add the Storage policies in Supabase dashboard
2. **Add Authorization Checks**: Ensure users can only edit/delete their own content
3. **Configure CSP Headers**: Add security headers in next.config.ts
4. **Set up Monitoring**: Implement error tracking (e.g., Sentry)
5. **Review Logs**: Set up log aggregation for security monitoring
6. **Backup Strategy**: Ensure database backups are configured
7. **HTTPS Enforcement**: Ensure all traffic is HTTPS (Vercel handles this)
8. **API Rate Limiting**: Consider using a service like Upstash Redis for distributed rate limiting

## 🚨 Security Contacts

- Report security issues to: [your-email]
- Security response time: 24-48 hours
