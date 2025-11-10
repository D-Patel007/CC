# 📱 Phone Verification - Quick Start

## ⚡ Test It NOW (No Twilio Needed!)

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, run:
supabase-phone-verification.sql
```

### 2. Test in Dev Mode
```bash
npm run dev
```

### 3. Visit Verification Page
```
http://localhost:3000/verify-phone
```

### 4. Enter Any Phone Number
```
(555) 123-4567
```

### 5. Check Console for Code
```
📱 [DEV MODE] Verification code for +15551234567: 542187
```

### 6. Enter Code
```
542187
```

### 7. Done! ✅
You're now verified!

---

## 🔧 Enable Real SMS (Optional)

### Environment Variables (.env)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Get Twilio Account
1. Sign up: https://www.twilio.com/try-twilio
2. Get $15 free credit (1,800+ SMS!)
3. Buy a phone number: $1/month
4. SMS cost: $0.0079 each

---

## 🎯 Key Features

✅ Works without Twilio (dev mode)  
✅ 6-digit codes, 15-min expiration  
✅ Beautiful UI with auto-formatting  
✅ One phone per account (prevents spam)  
✅ Verified badges ready to use  
✅ Error handling & validation  

---

## 📍 Important Files

- `/verify-phone` - Verification page
- `/api/phone/send-code` - Send SMS
- `/api/phone/verify-code` - Validate code
- `PhoneVerification.tsx` - UI component
- `VerifiedBadge.tsx` - Badge component

---

## 🚀 Next Steps

1. **Test it now** in dev mode
2. **Add Twilio** when ready for production
3. **Display badges** on profiles/listings
4. **Require verification** for posting (optional)

---

**Full docs**: See `PHONE-VERIFICATION-IMPLEMENTATION.md`
