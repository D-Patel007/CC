# Email Notification System

This document describes the email notification system implemented for Campus Connect using SendGrid SMTP.

## Overview

The platform sends automated email notifications for:
1. **New Messages** - When someone sends you a message
2. **Content Moderation** - When your content is flagged for review
3. **Event Reminders** - 24 hours before events you're attending

## Setup

### 1. SendGrid Configuration

Add these environment variables to your `.env.local`:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
CRON_SECRET=your_random_secret_token_here
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. SendGrid Account Setup

1. Create a SendGrid account at https://sendgrid.com
2. Verify your sender email address or domain
3. Create an API key with "Mail Send" permissions
4. Add the API key to your `.env.local`

### 3. Vercel Cron Setup (for Event Reminders)

The `vercel.json` file is already configured to run event reminders every hour. When you deploy to Vercel:

1. Vercel will automatically detect the cron configuration
2. Add the `CRON_SECRET` environment variable in your Vercel project settings
3. The cron job will run automatically every hour

Alternatively, you can:
- Use GitHub Actions to trigger the endpoint
- Use an external cron service (cron-job.org, EasyCron, etc.)
- Manually trigger during testing: `POST /api/cron/event-reminders` with `Authorization: Bearer YOUR_CRON_SECRET`

## Email Types

### 1. New Message Notification

**Trigger:** When a user receives a new message

**Location:** `app/api/messages/[id]/route.ts` (POST handler)

**Data Required:**
- Recipient email and name
- Sender name
- Message preview
- Conversation URL

**Template Features:**
- Shows sender name
- Displays message preview
- "Reply Now" button linking to conversation
- Supports both listing-related and direct messages

### 2. Content Flagged Notification

**Triggers:** 
- When content receives 3+ user reports (`app/api/reports/route.ts`)
- When NSFW content is detected during upload (`app/api/upload/route.ts`)

**Data Required:**
- User email and name
- Content type (listing, message, profile, event)
- Content title
- Reason for flagging
- Severity level (low, medium, high, critical)
- Dashboard URL for appeal

**Template Features:**
- Severity-based color coding (red for high/critical)
- Clear explanation of what was flagged
- Next steps for the user
- Link to profile/dashboard

### 3. Event Reminder

**Trigger:** Cron job runs every hour, finds events starting in 23-25 hours

**Location:** `app/api/cron/event-reminders/route.ts`

**Data Required:**
- Attendee email and name
- Event title
- Event date/time
- Event location
- Event URL
- Hours until event

**Template Features:**
- Countdown to event
- Full event details
- Location information
- "View Event Details" button

## Email Templates

All email templates are defined in `lib/email.ts`:

- `sendNewMessageNotification()`
- `sendContentFlaggedNotification()`
- `sendEventReminder()`

Templates use inline HTML/CSS for maximum email client compatibility.

## Error Handling

All email sending is wrapped in try-catch blocks and logs errors without failing the main request:

```typescript
try {
  await sendNewMessageNotification(...)
} catch (emailError) {
  console.error('Failed to send email:', emailError)
  // Request continues successfully
}
```

This ensures that:
- Failed emails don't break the user experience
- Errors are logged for monitoring
- The system degrades gracefully

## Testing

### Development Testing

1. **Message Notifications:**
   - Send a message to another user
   - Check your SendGrid activity feed for delivery status

2. **Content Moderation:**
   - Upload an image with NSFW content (gets auto-flagged)
   - Or have 3+ users report the same content

3. **Event Reminders (Manual):**
   ```bash
   curl -X POST http://localhost:3000/api/cron/event-reminders \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Production Monitoring

- Check SendGrid dashboard for email delivery rates
- Monitor logs for email errors
- Set up SendGrid webhooks for bounce/spam tracking

## Future Enhancements

### Email Preferences (Recommended)

Add user preferences to control which emails they receive:

1. Add `emailNotifications` boolean to Profile table
2. Update profile settings page with email toggle
3. Check preference before sending emails:
   ```typescript
   const { data: profile } = await supabase
     .from('Profile')
     .select('emailNotifications')
     .eq('id', userId)
     .single()
   
   if (profile?.emailNotifications !== false) {
     await sendNewMessageNotification(...)
   }
   ```

### Additional Email Types

Consider adding:
- Welcome email for new users
- Listing sold confirmation
- Weekly digest of new listings in favorite categories
- Account security alerts

### Email Queue

For high-volume deployments, consider:
- Implementing a message queue (Redis, AWS SQS)
- Batching emails to reduce API calls
- Retry logic for failed sends

## Troubleshooting

### Emails Not Sending

1. Check SendGrid API key is valid
2. Verify `SENDGRID_FROM_EMAIL` is verified in SendGrid
3. Check application logs for errors
4. Verify email doesn't end up in spam folder

### Cron Job Not Running

1. Ensure `CRON_SECRET` is set in Vercel environment variables
2. Check Vercel cron logs in dashboard
3. Verify `vercel.json` is in project root
4. Confirm you're on a Vercel plan that supports cron jobs

### Rate Limiting

SendGrid free tier limits:
- 100 emails/day (Free)
- 40,000-100,000 emails/month (Essentials: $19.95-$89.95/mo)

Monitor your usage in the SendGrid dashboard.

## Security Notes

- Never commit SendGrid API keys to Git
- Use environment variables for all secrets
- Protect cron endpoints with `CRON_SECRET`
- Validate all email addresses before sending
- Rate limit user-triggered emails to prevent abuse

## Support

For issues with:
- SendGrid API: https://sendgrid.com/docs/
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Campus Connect: Contact the development team
