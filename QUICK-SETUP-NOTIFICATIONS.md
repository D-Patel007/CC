# Quick Setup Guide - Notifications & Search

## 🚀 Quick Start (5 minutes)

### Step 1: Enable Real-time in Supabase
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Paste and run this command:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
```

### Step 2: Test Notifications
1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/notifications-test`
3. Click "Create Test Notification"
4. Look at notification bell (top right) - should update instantly! 🔔

### Step 3: Verify Search Bar
1. Go to homepage - see big search bar in hero section
2. Type something - see instant search results
3. Try on `/events` page too

## ✅ Success Indicators

- [ ] Notification bell updates without page refresh
- [ ] Unread count shows correct number
- [ ] Search bar is prominent on homepage
- [ ] Header feels less cramped
- [ ] Test notifications work at `/notifications-test`

## 🐛 Troubleshooting

**Notifications not appearing?**
- Check you ran the SQL in Supabase
- Verify you're logged in
- Check browser console for errors
- Verify RLS policies are enabled

**Search bar missing?**
- It's now in the hero section, not header
- Scroll to top of homepage to see it

**Real-time not working?**
- Confirm real-time is enabled in Supabase
- Check your Supabase project isn't paused
- Verify your env variables are correct

## 📚 More Info

See `NOTIFICATIONS-AND-SEARCH-UPDATE.md` for full documentation.
