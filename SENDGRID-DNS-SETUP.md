# SendGrid Domain Authentication Setup

## Overview
Email receipts are currently being sent from `campusconnect.receipts@gmail.com` via SendGrid. While emails are being delivered successfully, they may go to spam/junk folders because the domain is not authenticated.

**Goal:** Authenticate `umbconnect.com` with SendGrid so emails from `receipts@umbconnect.com` don't get flagged as spam.

---

## Current Status
✅ SendGrid account created: `zachary.ouldsfiya001@umb.edu`  
✅ Email sending working (goes to spam)  
⏳ Domain authentication pending (DNS records not added)  

---

## DNS Records to Add

The following DNS records need to be added to `umbconnect.com`:

### Record 1: Email Subdomain
- **Type:** CNAME
- **Host/Name:** `em8332`
- **Value:** `u5718802.wl053.sendgrid.net`
- **TTL:** 3600 (default)

### Record 2: DKIM Key 1
- **Type:** CNAME
- **Host/Name:** `s1._domainkey`
- **Value:** `s1.domainkey.u5718802.wl053.sendgrid.net`
- **TTL:** 3600

### Record 3: DKIM Key 2
- **Type:** CNAME
- **Host/Name:** `s2._domainkey`
- **Value:** `s2.domainkey.u5718802.wl053.sendgrid.net`
- **TTL:** 3600

### Record 4: DMARC Policy
- **Type:** TXT
- **Host/Name:** `_dmarc`
- **Value:** `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s`
- **TTL:** 3600

---

## Where to Add DNS Records

The domain `umbconnect.com` uses **Google Domains nameservers** (`ns-cloud-d1.googledomains.com`, etc.).

### Option 1: Add Records in Google Domains (Recommended)
1. Go to https://domains.google.com/ or https://domains.squarespace.com/
2. Sign in with the account that purchased `umbconnect.com`
3. Click on **umbconnect.com**
4. Navigate to **DNS** or **DNS Records** section
5. Click **"Add Record"** or **"Manage Custom Records"**
6. Add each of the 4 records above
7. Save changes

### Option 2: Transfer DNS to Vercel
1. Go to Vercel Dashboard → Project Settings → Domains
2. Click on **umbconnect.com** → Click **"Edit"**
3. Click **"Enable Vercel DNS"**
4. Vercel will provide new nameservers
5. Update nameservers in Google Domains to Vercel's nameservers
6. Wait for DNS propagation (24-48 hours)
7. Add the 4 SendGrid DNS records in Vercel's DNS management

---

## How to Verify

### 1. After Adding DNS Records:
- Wait **5-10 minutes** for DNS propagation
- Go to SendGrid: https://app.sendgrid.com/
- Navigate to **Settings** → **Sender Authentication**
- Find your domain authentication entry
- Click **"Verify"**
- If successful, you'll see a green checkmark ✅

### 2. Test DNS Records Manually:
```bash
# Check CNAME records
nslookup -type=CNAME em8332.umbconnect.com
nslookup -type=CNAME s1._domainkey.umbconnect.com
nslookup -type=CNAME s2._domainkey.umbconnect.com

# Check TXT record
nslookup -type=TXT _dmarc.umbconnect.com
```

---

## Update Email Sender After Verification

Once domain authentication is complete, update `.env.local`:

```bash
# Change from:
SENDGRID_FROM_EMAIL=campusconnect.receipts@gmail.com

# To:
SENDGRID_FROM_EMAIL=receipts@umbconnect.com
```

You can also use:
- `noreply@umbconnect.com`
- `transactions@umbconnect.com`
- `hello@umbconnect.com`

**Note:** You must also verify the specific email address in SendGrid:
1. Go to SendGrid → Settings → Sender Authentication
2. Click **"Create New Sender"** or **"Verify Single Sender"**
3. Enter `receipts@umbconnect.com` (or chosen address)
4. SendGrid will send a verification email to that address
5. You'll need to set up email forwarding or catch-all for `@umbconnect.com` to receive the verification

---

## Troubleshooting

### Issue: Can't find who owns the domain
**Solution:** Check with your team members. Run `whois umbconnect.com` to find registrar contact info.

### Issue: Don't have access to Google Domains
**Solution:** Ask the domain owner to either:
1. Give you access to the Google Domains account, or
2. Add the DNS records themselves (share this document with them)

### Issue: DNS records not propagating
**Solution:** 
- Wait up to 24-48 hours for full DNS propagation
- Use https://dnschecker.org/ to check propagation status
- Ensure there are no typos in the DNS records

### Issue: Verification failing in SendGrid
**Solution:**
1. Double-check all DNS records are exactly as specified
2. Wait longer for DNS propagation
3. Remove and re-add the DNS records
4. Contact SendGrid support if issue persists

---

## Additional Resources

- SendGrid Domain Authentication Docs: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- Vercel DNS Management: https://vercel.com/docs/concepts/projects/domains
- Google Domains Help: https://support.google.com/domains/

---

## Contact Information

**SendGrid Account:** zachary.ouldsfiya001@umb.edu  
**Domain:** umbconnect.com  
**Current DNS Host:** Google Domains  
**Deployed App:** https://umbconnect.com (via Vercel)

---

**Last Updated:** November 6, 2025  
**Status:** DNS records generated, awaiting domain owner to add them
