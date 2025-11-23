# 🗺️ Moderation System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 Create Listing/Message  →  🚩 Report Button  →  👤 Profile │
│                                                                 │
└────────────┬────────────────────────┬────────────────┬─────────┘
             │                        │                │
             ↓                        ↓                ↓
┌────────────────────┐    ┌──────────────────┐   ┌─────────────┐
│  MODERATION        │    │  USER REPORTS    │   │  ADMIN      │
│  PIPELINE          │    │  API             │   │  DASHBOARD  │
├────────────────────┤    ├──────────────────┤   ├─────────────┤
│                    │    │                  │   │             │
│ 1. Text Check      │    │ Submit Report    │   │ View Queue  │
│ 2. DB Prohibited   │    │ Category Select  │   │ Review Item │
│ 3. Image NSFW      │    │ Auto-flag if 3+  │   │ Take Action │
│ 4. Spam Score      │    │                  │   │ View Stats  │
│                    │    │                  │   │             │
│ ↓                  │    │ ↓                │   │ ↓           │
│ Auto-Reject OR     │    │ Create Flagged   │   │ Approve/    │
│ Flag for Review    │    │ Content          │   │ Reject/     │
│                    │    │                  │   │ Delete      │
└────────────┬───────┘    └────────┬─────────┘   └──────┬──────┘
             │                     │                     │
             │                     │                     │
             └─────────────────────┴─────────────────────┘
                                   │
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 ProhibitedItem   →  Keywords, Patterns, Categories          │
│  🚩 FlaggedContent   →  Moderation Queue                        │
│  ⚠️  UserStrike      →  Violation Tracking                      │
│  📊 ModerationLog    →  Audit Trail                             │
│  📢 UserReport       →  User Submissions                        │
│  👤 Profile          →  role, isAdmin, isSuspended              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Content Creation & Auto-Moderation

```
User Creates Content
        │
        ↓
┌───────────────────┐
│  Text Moderation  │
│  (lib/moderation) │
└────────┬──────────┘
         │
         ├──→ Check Built-in Keywords (spam, scam, profanity)
         │
         ├──→ Query ProhibitedItem Table
         │         │
         │         ├─→ Match keyword?
         │         ├─→ Match regex?
         │         └─→ Match category?
         │
         └──→ Calculate Spam Score (0-100)
                    │
        ┌───────────┴──────────────┐
        │                          │
    Score < 40              Score ≥ 70
        │                          │
        ↓                          ↓
  ✅ Approve              🚫 Auto-Reject
        │                          │
        │                          └──→ Create FlaggedContent
        │                                (status: rejected)
        │
   Score 40-69
        │
        ↓
  ⚠️ Flag for Review
        │
        └──→ Create FlaggedContent
              (status: pending)
```

### 2. User Reporting Flow

```
User Clicks Report Button
        │
        ↓
┌─────────────────┐
│  Select Category │
│  Add Description │
└────────┬─────────┘
         │
         ↓
  POST /api/reports
         │
         ├──→ Check if content exists
         │
         ├──→ Check for duplicate report
         │
         └──→ Create UserReport
                     │
         ┌───────────┴──────────────┐
         │                          │
    < 3 Reports                ≥ 3 Reports
         │                          │
         ↓                          ↓
  Just Log Report          Auto-Create FlaggedContent
                                  │
                                  └──→ Admin Notified
```

### 3. Admin Review Process

```
Admin Opens Dashboard
        │
        ↓
GET /api/admin/flagged-content
        │
        └──→ Fetch pending flags
                │
                ↓
        ┌───────────────┐
        │  Display Queue │
        │  - Filters     │
        │  - Sort        │
        │  - Paginate    │
        └────────┬───────┘
                 │
                 ↓
        Admin Clicks "Review"
                 │
                 ↓
        ┌────────────────┐
        │  View Details  │
        │  - Content     │
        │  - User Info   │
        │  - Reasons     │
        │  - History     │
        └────────┬────────┘
                 │
         ┌───────┴──────┬─────────┬──────────┐
         │              │         │          │
         ↓              ↓         ↓          ↓
    ✅ Approve    ⚠️ Reject   🚨 Strike   🗑️ Delete
         │              │         │          │
         │              │         │          ├──→ Delete Content
         │              │         │          │
         │              │         └──────────┴──→ Create UserStrike
         │              │                            │
         └──────────────┴────────────────────────────┤
                                                     │
                                                     ↓
                                            Update FlaggedContent
                                                     │
                                                     └──→ Log to ModerationLog
```

### 4. Strike & Suspension System

```
Admin Issues Strike
        │
        ↓
Insert into UserStrike
        │
        └──→ Trigger: check_strike_threshold()
                       │
                       ├──→ Count active strikes for user
                       │
                ┌──────┴──────┐
                │             │
            < 3 Strikes   ≥ 3 Strikes
                │             │
                ↓             ↓
          No Action    Auto-Suspend User
                              │
                              ├──→ SET isSuspended = TRUE
                              ├──→ SET suspendedUntil = NOW() + 7 days
                              └──→ SET suspensionReason = "3 strikes"
                                        │
                                        ↓
                              User Cannot Create Content
                              (Blocked by auth middleware)
```

---

## API Endpoint Map

```
PUBLIC APIs (Authenticated Users)
│
├─ POST   /api/reports              → Submit user report
└─ GET    /api/reports              → View own reports


ADMIN APIs (Admin/Moderator Only)
│
├─ Prohibited Items
│  ├─ GET     /api/admin/prohibited-items     → List items
│  ├─ POST    /api/admin/prohibited-items     → Add new item
│  ├─ PATCH   /api/admin/prohibited-items     → Update item
│  └─ DELETE  /api/admin/prohibited-items?id  → Remove item
│
├─ Flagged Content (Review Queue)
│  ├─ GET     /api/admin/flagged-content      → List flags
│  └─ PATCH   /api/admin/flagged-content      → Review & take action
│
└─ Statistics
   └─ GET     /api/admin/stats                → Get metrics
```

---

## Component Architecture

```
PAGES
│
├─ /admin/moderation
│  └─ AdminModerationPage.tsx
│     ├─ Fetches flagged content
│     ├─ Displays stats
│     ├─ Filter controls
│     └─ Review modal
│
└─ /admin/prohibited-items (TODO)


COMPONENTS
│
├─ ReportButton.tsx
│  ├─ Report modal
│  ├─ Category select
│  └─ Submit to API
│
└─ VerifiedBadge.tsx (existing)


LIBRARIES
│
├─ lib/moderation.ts
│  ├─ moderateText()
│  ├─ moderateTextWithDatabase()
│  ├─ moderateImage()
│  ├─ createFlaggedContent()
│  └─ shouldAutoReject()
│
├─ lib/admin-middleware.ts
│  ├─ requireAdmin()
│  ├─ requireFullAdmin()
│  ├─ isAdmin()
│  └─ logAdminAction()
│
└─ lib/auth-middleware.ts (existing)
   └─ requireAuth()
```

---

## Database Relationships

```
Profile (Users)
    │
    ├──< UserStrike (violations)
    │      └──> FlaggedContent (linked violation)
    │
    ├──< UserReport (reports submitted by user)
    │      └──> FlaggedContent (created from report)
    │
    ├──< FlaggedContent (content owned by user)
    │      └──> UserStrike (strikes from this content)
    │
    ├──< ModerationLog (as admin who took action)
    │
    └──< ProhibitedItem (as creator)


Content Tables
    │
    ├─ Listing
    ├─ Message  
    ├─ Event
    └─ Profile
         │
         └──> FlaggedContent (references via contentId + contentType)
```

---

## Security Layers

```
┌─────────────────────────────────────┐
│  Row Level Security (RLS)           │
│  - Only admins see moderation data  │
│  - Users see own reports/strikes    │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  Middleware Protection              │
│  - requireAdmin() checks role       │
│  - Blocks non-admin API access      │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  Role-Based Access Control          │
│  - user: Normal access              │
│  - moderator: Review only           │
│  - admin: Full control              │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  Audit Logging                      │
│  - All actions logged               │
│  - ModerationLog table              │
│  - Timestamp + admin ID             │
└─────────────────────────────────────┘
```

---

## Moderation Decision Tree

```
Content Created
    │
    ↓
Moderation Pipeline Runs
    │
    ├─→ Contains CRITICAL prohibited item?
    │   └─→ YES → Auto-Reject + Flag
    │
    ├─→ Contains HIGH prohibited item?
    │   └─→ YES → Flag for Review (auto_reject or flag action)
    │
    ├─→ Spam Score ≥ 70?
    │   └─→ YES → Auto-Reject + Flag
    │
    ├─→ Spam Score 40-69?
    │   └─→ YES → Flag for Review
    │
    └─→ Clean (Score < 40)
        └─→ Publish Content ✅


Flagged Content
    │
    ↓
Admin Reviews
    │
    ├─→ False Positive?
    │   └─→ Approve ✅
    │
    ├─→ Violation but Minor?
    │   └─→ Reject ⚠️
    │
    ├─→ Violation + Pattern?
    │   └─→ Reject + Strike 🚨
    │
    └─→ Serious Violation?
        └─→ Delete + Strike + Possible Ban 🗑️
```

---

This architecture provides:
- ✅ Separation of concerns
- ✅ Scalable design
- ✅ Clear data flow
- ✅ Security at every layer
- ✅ Comprehensive audit trail
