# Email Notification Setup Checklist

## ✅ Completed
- [x] SendGrid API key configured
- [x] SendGrid from email configured
- [x] Environment variables added to .env.local
- [x] Email notification functions created in lib/email.ts
- [x] Message notifications integrated
- [x] Content moderation emails integrated
- [x] Event reminder cron job created
- [x] Email preferences system created

## 🚀 Next Steps

### 1. Run Database Migration
Copy and paste the contents of `supabase-email-preferences.sql` into your Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/olkpmvzfwvtivasxceqd/sql
2. Paste the SQL from `supabase-email-preferences.sql`
3. Click "Run"

This will add these columns to your Profile table:
- `emailNotifications` (master toggle)
- `emailNewMessages` 
- `emailContentFlags`
- `emailEventReminders`

### 2. Verify SendGrid From Email
Make sure `campusconnect.receipts@gmail.com` is verified in SendGrid:
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. If not verified, complete the verification process
3. Check your Gmail for verification email

### 3. Test Message Notifications

**Option A: Test with Real Users**
1. Start your dev server: `npm run dev`
2. Log in as two different users
3. Send a message from User A to User B
4. Check User B's email inbox

**Option B: Check Logs**
Look for these console messages when a message is sent:
```
✅ Message notification sent to: user@example.com
```

### 4. Test Content Moderation Emails

**Test NSFW Detection:**
1. Try uploading an inappropriate image
2. It should be rejected and you'll get an email
3. Check for: `❌ Image rejected - NSFW content detected` in logs

**Test User Reports:**
1. Have 3 different users report the same content
2. The content owner should receive an email
3. Check admin dashboard at `/admin/moderation`

### 5. Test Event Reminders (Manual)

Since cron jobs only run in production, test manually:
```bash
# In a new terminal
curl -X POST http://localhost:3000/api/cron/event-reminders -H "Authorization: Bearer campus-connect-cron-secret-2025"
```

Or create an event starting in 24 hours and wait for the hourly cron to run in production.

### 6. Restart Your Dev Server

If your dev server is running, restart it to load the new environment variables:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

## 🧪 Testing Checklist

- [ ] Database migration completed
- [ ] SendGrid from email verified
- [ ] Dev server restarted
- [ ] Test message notification (send message between users)
- [ ] Check email received in inbox
- [ ] Check for spam folder if email missing
- [ ] Test NSFW upload rejection (optional)
- [ ] Verify email preferences columns exist in database

## 📊 Monitoring

### Check SendGrid Activity
View sent emails and delivery status:
https://app.sendgrid.com/email_activity

### Check Application Logs
Look for these messages:
- `✅ Message notification sent to: [email]`
- `✅ Content flagged email sent to: [email]`
- `✅ Event reminder sent to: [email]`
- `❌ Failed to send [type] notification:` (errors)

## 🐛 Troubleshooting

### Emails Not Sending?

1. **Check SendGrid API Key:**
   ```bash
   echo $env:SENDGRID_API_KEY
   ```
   Should show: `SG.IynX0X8jRV22Mkna2Cu11w...`

2. **Check From Email:**
   Must be verified in SendGrid dashboard

3. **Check Application Logs:**
   Look for error messages starting with `❌ Failed to send`

4. **Check Spam Folder:**
   First emails often go to spam

5. **Verify Database Columns:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'Profile' AND column_name LIKE 'email%';
   ```

### Emails Going to Spam?

- Verify your domain in SendGrid (instead of Gmail)
- Set up SPF/DKIM records
- Ask recipients to mark as "Not Spam"

### Cron Job Not Running?

- Only works in Vercel production (not localhost)
- Set `CRON_SECRET` in Vercel dashboard
- Check Vercel cron logs

## 🎯 Current Configuration

**Environment Variables:**
```
SENDGRID_API_KEY=SG.IynX0X8jRV22Mkna2Cu11w... ✅
SENDGRID_FROM_EMAIL=campusconnect.receipts@gmail.com ✅
CRON_SECRET=campus-connect-cron-secret-2025 ✅
NEXT_PUBLIC_BASE_URL=http://localhost:3000 ✅
```

**Email Types Implemented:**
1. ✅ New message notifications
2. ✅ Content flagged alerts (NSFW + Reports)
3. ✅ Event reminders (24hr before)

**Email Preferences:**
- Default: All notifications enabled
- Users can disable per notification type
- Respects privacy preferences

## 📚 Documentation

See `EMAIL-NOTIFICATIONS.md` for complete documentation including:
- API endpoint details
- Email template customization
- Production deployment guide
- Advanced configuration options

## 🚀 Production Deployment

When deploying to Vercel:
1. Add all environment variables in Vercel dashboard
2. Change `NEXT_PUBLIC_BASE_URL` to your domain
3. Vercel will automatically run the cron job hourly
4. Monitor SendGrid dashboard for delivery rates

---

**Need Help?** Check the logs or SendGrid activity feed for debugging info.
