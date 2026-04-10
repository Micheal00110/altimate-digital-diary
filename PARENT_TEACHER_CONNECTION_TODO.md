# Parent-Teacher Connection & Authentication TODO List

## 🎯 Overview
This document outlines the connection system for parents and teachers to communicate and collaborate through the child's diary. Teachers will upload diary entries, parents will sign/review them, and both can message each other.

---

## Phase 1: Authentication & User Management (Week 1)

### 1.1 Database Schema Updates
**Purpose:** Extend database to support parent-teacher relationships

**Tasks:**
- [ ] Create `users` table
  - id (uuid primary key)
  - email (unique)
  - password_hash (hashed)
  - user_type ('teacher' | 'parent' | 'admin')
  - name (full name)
  - phone_number (optional)
  - avatar_url (optional)
  - is_active (boolean)
  - created_at, updated_at

- [ ] Create `teacher_profile` table
  - id (uuid)
  - user_id (FK to users)
  - qualification (e.g., "B.Ed", "M.A Education")
  - school_name
  - class_grade (e.g., "Grade 3", "Kindergarten")
  - subject_specialization (optional)
  - years_of_experience
  - bio (optional)

- [ ] Create `parent_profile` table
  - id (uuid)
  - user_id (FK to users)
  - relationship_to_child ('mother' | 'father' | 'guardian')
  - occupation (optional)
  - phone_number
  - emergency_contact (optional)

- [ ] Create `child_enrollment` table (relationship mapper)
  - id (uuid)
  - child_id (FK to child_profile)
  - teacher_id (FK to teacher_profile)
  - parent_id (FK to parent_profile)
  - enrolled_date
  - class_year (e.g., "2025-2026")
  - status ('active' | 'archived')

- [ ] Create `connection_requests` table
  - id (uuid)
  - from_user_id (FK to users)
  - to_user_id (FK to users)
  - child_id (FK to child_profile)
  - status ('pending' | 'accepted' | 'rejected')
  - created_at
  - responded_at (nullable)

### 1.2 Supabase Authentication Setup
**Purpose:** Configure email/password auth for secure login

**Tasks:**
- [ ] Enable Supabase Auth (Email/Password provider)
- [ ] Configure email templates (signup confirmation, password reset)
- [ ] Set up password requirements policy
- [ ] Configure session timeout (30 mins idle)
- [ ] Set up JWT token expiry (24 hours)

### 1.3 Create Auth Service
**Purpose:** Wrap Supabase Auth with app-specific logic

**Files to Create:**
- [ ] src/lib/auth.ts
  - signUpTeacher(email, password, teacherData)
  - signUpParent(email, password, parentData)
  - login(email, password)
  - logout()
  - getCurrentUser()
  - resetPassword(email)
  - updateProfile(userData)
  - verifyEmail(token)

- [ ] src/contexts/AuthContext.tsx
  - Provide current user to entire app
  - Track auth loading state
  - Handle session persistence
  - Expose signup/login/logout functions

### 1.4 Create Auth UI Components
**Purpose:** User-facing authentication interfaces

**Files to Create:**
- [ ] src/components/LoginPage.tsx
  - Email/password login form
  - "Sign up" link
  - "Forgot password?" link
  - Role selector (Teacher vs Parent)

- [ ] src/components/SignupPage.tsx
  - Role selector (Teacher vs Parent)
  - Show appropriate form fields:
    - **Teachers:** School, Grade, Qualification, Bio
    - **Parents:** Relationship, Phone Number
  - Email validation
  - Password strength indicator
  - Terms & conditions checkbox

- [ ] src/components/PasswordReset.tsx
  - Email input
  - Token verification
  - New password form
  - Success confirmation

---

## Phase 2: Connection Management (Week 2)

### 2.1 Connection Request System
**Purpose:** Allow teachers and parents to connect to each other

**Tasks:**
- [ ] Create connection request API
  - POST /api/connections/request
    - Input: to_user_id, child_id, message (optional)
    - Returns: request_id, status
  
  - GET /api/connections/pending
    - Returns: list of pending requests for current user
  
  - POST /api/connections/accept
    - Input: request_id
    - Creates child_enrollment record
  
  - POST /api/connections/reject
    - Input: request_id
    - Deletes request

### 2.2 Teacher Discovery
**Purpose:** Help parents find their child's teacher

**Files to Create:**
- [ ] src/lib/teacherDiscovery.ts
  - searchTeachersBySchool(schoolName)
  - searchTeachersByGrade(grade)
  - searchTeachersByName(name)
  - getTeacherProfile(teacherId)

- [ ] src/components/TeacherSearch.tsx
  - Search form (school, grade, name)
  - Teacher profile cards
  - "Send Connection Request" button
  - Show verification badge if verified teacher

### 2.3 Connection Requests UI
**Purpose:** Show and manage pending connections

**Files to Create:**
- [ ] src/components/ConnectionRequests.tsx
  - List pending requests for user
  - Show requester info (name, role, school if teacher)
  - Accept/Reject/Block buttons
  - Auto-approve option (trust list)

- [ ] src/components/MyConnections.tsx
  - List all accepted connections
  - Show: Teacher, Parents, Children
  - Option to remove connection
  - View connection details (since when, class info)

---

## Phase 3: Communication Channel (Week 3)

### 3.1 Messaging System Database
**Purpose:** Enable parent-teacher messaging

**Database Changes:**
- [ ] Extend `messages` table
  - Add `thread_id` (for conversation grouping)
  - Add `attachment_url` (for photos, documents)
  - Add `read_by` (JSON: {parent_id: timestamp, teacher_id: timestamp})

- [ ] Create `message_threads` table
  - id (uuid)
  - child_id (FK)
  - teacher_id (FK)
  - parent_id (FK)
  - title (e.g., "Homework Discussion")
  - created_at
  - last_message_at
  - is_archived (boolean)

### 3.2 Real-time Messaging
**Purpose:** Send/receive messages with real-time updates

**Files to Create:**
- [ ] src/lib/messaging.ts
  - sendMessage(threadId, content, attachments?)
  - getMessageThread(threadId)
  - markAsRead(messageId)
  - archiveThread(threadId)
  - subscribeToThread(threadId) - real-time updates

- [ ] src/components/MessageThread.tsx
  - List all messages in thread
  - Compose reply box
  - File attachment preview
  - Read receipts (show "read at X time")
  - Timestamps

- [ ] src/components/MessagesPanel.tsx
  - List all message threads
  - Search threads
  - Show unread count
  - Show last message preview
  - "New Message" button to start conversation

### 3.3 Notification System
**Purpose:** Notify users of new messages

**Files to Create:**
- [ ] src/lib/notifications.ts
  - subscribeToNotifications()
  - dismissNotification(id)
  - getUnreadCount()

- [ ] src/components/NotificationCenter.tsx
  - Show notification badge in header
  - Dropdown with notification history
  - Mark as read options
  - Settings to customize notification types

---

## Phase 4: Diary Entry Handoff (Week 4)

### 4.1 Teacher-side Diary Entry
**Purpose:** Teachers upload daily diary entries

**Files to Modify/Create:**
- [ ] src/components/TeacherDiaryEntry.tsx
  - Form to create diary entry (date, activities, meals, mood, etc.)
  - File upload for photos/videos
  - Save as draft
  - Publish to parents
  - View entry responses (parent signatures)

### 4.2 Parent-side Entry Review
**Purpose:** Parents review and sign entries

**Files to Modify/Create:**
- [ ] src/components/ParentDiaryReview.tsx
  - Display teacher's entry
  - Add parent comment/signature
  - Like/react with emoji
  - Set reminder for follow-up

### 4.3 Entry Status Tracking
**Purpose:** Track entry lifecycle

**Database Changes:**
- [ ] Add `entry_status` to diary_entries table
  - Values: 'draft' | 'published' | 'signed_by_parent' | 'archived'
  - timestamp for each status change

- [ ] Create `entry_approvals` table (track parent signatures)
  - id (uuid)
  - entry_id (FK)
  - parent_id (FK)
  - signature_image_url
  - comments
  - timestamp

---

## Phase 5: Offline Sync for Connections (Week 5)

### 5.1 Sync Strategy for Users & Connections
**Purpose:** Sync user data while maintaining connection integrity

**Tasks:**
- [ ] Extend offlineSync.ts to handle:
  - User profile data
  - Connection list
  - Message threads metadata (not full messages)
  - Teacher/parent profile info

- [ ] Create conflict resolution for:
  - Connection request accepted by both simultaneously
  - User profile updated locally and remotely
  - Message marked as read offline

### 5.2 Offline Connection State
**Purpose:** Cache connections for offline access

**Files to Create/Modify:**
- [ ] src/lib/offlineSync.ts
  - Add table: "user_connections" (cached list)
  - Add table: "user_profiles" (cached teacher/parent data)

---

## Phase 6: Security & Permissions (Week 6)

### 6.1 Row-Level Security (RLS)
**Purpose:** Ensure users can only see their data

**Supabase RLS Policies:**
- [ ] users table
  - Users can only view their own profile
  - Teachers can view parent profiles (connected children only)
  - Parents can view teacher profiles (connected children only)

- [ ] messages table
  - Users can only see messages where they're involved
  - Admin can see all messages

- [ ] connection_requests table
  - Users can only see requests sent/received to them
  - Cannot view others' requests

- [ ] diary_entries table
  - Teacher can view/edit their entries
  - Parents can view entries for their children
  - Teacher can view parent comments

### 6.2 Role-Based Access Control (RBAC)
**Purpose:** Different features for different roles

**Files to Create:**
- [ ] src/lib/permissions.ts
  - canViewChild(userId, childId)
  - canEditDiaryEntry(userId, entryId)
  - canSendMessage(userId, threadId)
  - isVerifiedTeacher(userId)
  - hasParentAccess(userId)

- [ ] src/components/ProtectedRoute.tsx
  - Guard routes based on role
  - Redirect unauthorized users
  - Show permission denied page

---

## Phase 7: Verification & Trust (Week 7)

### 7.1 Teacher Verification
**Purpose:** Verify teachers are real educators

**Tasks:**
- [ ] Create teacher verification system
  - Submit proof of qualification
  - Admin review process
  - Award "Verified Teacher" badge
  - Revoke if abuse detected

- [ ] Extend teacher_profile table
  - Add `verification_status` ('unverified' | 'pending' | 'verified' | 'rejected')
  - Add `verification_document_url`
  - Add `verified_at` (timestamp)
  - Add `verified_by` (admin user id)

### 7.2 Trust & Reporting
**Purpose:** Maintain safe community

**Database Tables:**
- [ ] Create `reports` table (user reports)
  - id, reported_user_id, reported_by, reason, status, created_at

- [ ] Create `blocked_users` table
  - id, user_id, blocked_user_id, reason, created_at

**Files to Create:**
- [ ] src/lib/safety.ts
  - reportUser(userId, reason)
  - blockUser(userId)
  - unblockUser(userId)
  - isBlocked(userId, otherUserId)

---

## Phase 8: Features & Polish (Week 8)

### 8.1 Analytics & Monitoring
**Purpose:** Track engagement and performance

- [ ] Create admin dashboard
- [ ] Track: DAU, MAU, avg messages per day, avg diary entries
- [ ] Teacher activity monitoring
- [ ] Parent engagement tracking

### 8.2 Email Notifications
**Purpose:** Notify users of important events

- [ ] New connection request email
- [ ] New diary entry ready email
- [ ] Message reply email
- [ ] Parent signature reminder email

### 8.3 Export Features
**Purpose:** Allow data export for record-keeping

- [ ] Export diary entries as PDF
- [ ] Export conversation history
- [ ] Monthly report generation

---

## 📊 Implementation Checklist

| Phase | Tasks | Estimated Time |
|-------|-------|-----------------|
| Phase 1 | Auth & Users | 1 week |
| Phase 2 | Connections | 1 week |
| Phase 3 | Messaging | 1 week |
| Phase 4 | Diary Handoff | 1 week |
| Phase 5 | Offline Sync | 1 week |
| Phase 6 | Security | 1 week |
| Phase 7 | Verification | 1 week |
| Phase 8 | Polish | 1 week |
| **TOTAL** | **All Phases** | **~8 weeks** |

---

## 🎯 Critical Path (Do These First!)

**Must Have to Launch MVP:**
1. Phase 1: Auth (Sign up/login must work)
2. Phase 2: Connections (Teachers & parents must connect)
3. Phase 4: Diary Handoff (Core feature - upload & sign entries)
4. Phase 3: Messaging (Communication between parent & teacher)

**Can Be Added Later:**
- Phase 5: Offline sync (nice to have)
- Phase 6: Advanced security (can be basic initially)
- Phase 7: Verification (start with email verification only)
- Phase 8: Polish features

---

## 💡 Key Considerations

**Security:**
- Hash all passwords
- Use HTTPS only
- Never store sensitive data in localStorage
- Implement rate limiting on auth endpoints

**UX:**
- Clear role distinction (Teacher vs Parent UI different)
- Confirmation for critical actions (delete entries, block users)
- Clear messaging about who can see what

**Performance:**
- Pagination for large message threads
- Lazy load diary entries (by date range)
- Cache teacher profiles
- Use read replicas for teacher search

**Compliance:**
- COPPA (if users under 13)
- GDPR (data deletion, consent)
- FERPA (educational records privacy)
- School-specific data policies

---

## 🚀 Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize features** (MVP vs Phase 2)
3. **Set deadline** for each phase
4. **Assign team members** to phases
5. **Create Jira/GitHub tickets** from these tasks
6. **Begin Phase 1** implementation

