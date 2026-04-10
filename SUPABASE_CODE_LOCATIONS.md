# 📍 WHERE IS ALL THE SUPABASE CODE?

## 🎯 Quick Map

```
Your Project Structure:
/home/mike/Downloads/my-child-ediary-main/
├── .env.local (⭐ Supabase credentials)
├── .env.example (⭐ Supabase env template)
├── supabase/
│   └── migrations/ (⭐ ALL DATABASE SCHEMA CODE)
│       ├── 20260408085639_create_mychild_diary_schema.sql
│       ├── 20260408090000_add_communication_features.sql
│       ├── 20260408091000_add_parent_teacher_connection_system.sql
│       └── 20260408092000_add_offline_sync_tables.sql
└── src/
    ├── lib/
    │   ├── supabase.ts (⭐ CLIENT INITIALIZATION)
    │   └── auth.ts (⭐ AUTH SERVICE)
    ├── contexts/
    │   └── AuthContext.tsx (⭐ AUTH CONTEXT)
    ├── components/
    │   └── ProfileSetup.tsx (⭐ USES SUPABASE)
    └── App.tsx (⭐ USES SUPABASE)
```

---

## 🔍 FILE-BY-FILE BREAKDOWN

### 1. **src/lib/supabase.ts** ⭐ MAIN CLIENT
**Location:** `/home/mike/Downloads/my-child-ediary-main/src/lib/supabase.ts`

**What it does:**
- Creates Supabase client with credentials from `.env`
- Exports client for use throughout app
- Defines TypeScript interfaces for database tables

**Key exports:**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ChildProfile { ... }
export interface DiaryEntry { ... }
export interface Message { ... }
export interface Announcement { ... }
```

**Where it's used:**
- Imported in: `App.tsx`, `AuthContext.tsx`, `auth.ts`, all components

---

### 2. **src/lib/auth.ts** ⭐ AUTH SERVICE
**Location:** `/home/mike/Downloads/my-child-ediary-main/src/lib/auth.ts`

**What it does:**
- Wraps Supabase Auth with app-specific functions
- Handles user signup (teacher & parent)
- Handles login, logout, password reset
- Manages teacher & parent profiles

**Key functions:**
```typescript
export const authService = {
  async signUpTeacher(data: TeacherData, password: string)
  async signUpParent(data: ParentData, password: string)
  async signIn(email: string, password: string)
  async signOut()
  async getCurrentUser()
  async resetPassword(email: string)
  async updatePassword(newPassword: string)
  async getTeacherProfile(userId: string)
  async getParentProfile(userId: string)
  // ... more functions
}
```

**Where it's used:**
- Called from: `AuthContext.tsx`, login/signup components

---

### 3. **src/contexts/AuthContext.tsx** ⭐ AUTH STATE
**Location:** `/home/mike/Downloads/my-child-ediary-main/src/contexts/AuthContext.tsx`

**What it does:**
- Provides authentication state to entire app
- Tracks current user, loading state, session
- Handles auth state changes
- Exposes login/logout functions

**Key exports:**
```typescript
export function AuthProvider({ children })
export function useAuth()
```

**Where it's used:**
- Wraps entire `App.tsx` in `main.tsx`
- Imported in components that need auth info

---

### 4. **src/App.tsx** ⭐ MAIN APP
**Location:** `/home/mike/Downloads/my-child-ediary-main/src/App.tsx`

**What it does:**
- Uses `supabase` client for queries
- Uses `useAuth()` for user state
- Shows conditional UI based on auth

**Supabase code examples:**
```typescript
// Loads notifications from Supabase
const [messagesRes, announcementsRes] = await Promise.all([
  supabase.from('messages').select('id').eq('is_read', false),
  supabase.from('announcements').select('id')
]);

// Checks user profile
const { data, error } = await supabase
  .from('child_profile')
  .select('*')
  .maybeSingle();
```

---

### 5. **src/components/ProfileSetup.tsx** ⭐ PROFILE CREATION
**Location:** `/home/mike/Downloads/my-child-ediary-main/src/components/ProfileSetup.tsx`

**What it does:**
- Creates new child profile in Supabase
- Inserts data into `child_profile` table

**Supabase code:**
```typescript
const { error } = await supabase
  .from('child_profile')
  .insert([{
    name: childName,
    grade: childGrade,
    school: childSchool
  }]);
```

---

### 6. **src/components/DiaryEntry.tsx** ⭐ DIARY OPERATIONS
**Location:** `/home/mike/Downloads/my-child-ediary-main/src/components/DiaryEntry.tsx`

**What it does:**
- Loads diary entries from Supabase
- Saves/updates diary entries
- Uses offline sync (IndexedDB fallback)

**Supabase code:**
```typescript
// Read
const { data, error } = await supabase
  .from('diary_entries')
  .select('*')
  .eq('date', selectedDate)
  .maybeSingle();

// Write
const { error } = await supabase
  .from('diary_entries')
  .insert([entryData]);
```

---

### 7. **supabase/migrations/** ⭐ DATABASE SCHEMA

#### **20260408085639_create_mychild_diary_schema.sql**
**Location:** `/home/mike/Downloads/my-child-ediary-main/supabase/migrations/`

**Creates:**
- `child_profile` table
- `diary_entries` table
- Indexes & RLS policies

```sql
CREATE TABLE IF NOT EXISTS child_profile (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  school TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  subject TEXT,
  homework TEXT,
  teacher_comment TEXT,
  signed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **20260408090000_add_communication_features.sql**
**Creates:**
- `messages` table
- `announcements` table

```sql
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_type TEXT CHECK (sender_type IN ('parent', 'teacher')),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **20260408091000_add_parent_teacher_connection_system.sql** ⭐ NEW
**Creates:** 15 tables (user auth, profiles, messaging, etc.)

```sql
-- Users authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  user_type TEXT CHECK (user_type IN ('teacher', 'parent', 'admin')),
  name TEXT NOT NULL,
  // ... more fields
);

-- Teacher profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  qualification TEXT,
  school_name TEXT,
  // ... more fields
);

-- Parent profiles
CREATE TABLE IF NOT EXISTS parent_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  relationship_to_child TEXT,
  // ... more fields
);

-- And many more...
```

#### **20260408092000_add_offline_sync_tables.sql** ⭐ NEW
**Creates:** 4 tables for offline sync

```sql
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY,
  user_id UUID,
  operation TEXT,
  data JSONB
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY,
  sync_queue_id UUID,
  local_version JSONB,
  remote_version JSONB
);
```

---

## 🔌 SUPABASE CONNECTION FLOW

```
1. User Opens App
   ↓
2. main.tsx initializes AuthProvider
   ↓
3. AuthContext.tsx calls supabase.auth.getSession()
   ↓
4. src/lib/supabase.ts (supabase client) makes request
   ↓
5. Supabase responds with user session
   ↓
6. App displays appropriate UI based on auth state
   ↓
7. When user interacts:
   - Login → authService.signIn() → supabase.auth.signInWithPassword()
   - Create diary → supabase.from('diary_entries').insert()
   - Save profile → supabase.from('child_profile').insert()
   ↓
8. Supabase processes query on database
   ↓
9. App receives response & updates local state
```

---

## 📝 SUPABASE CODE LOCATIONS SUMMARY

| Type | File | Purpose |
|------|------|---------|
| **Client Init** | src/lib/supabase.ts | Create Supabase client |
| **Auth Logic** | src/lib/auth.ts | User auth functions |
| **Auth State** | src/contexts/AuthContext.tsx | Global auth state |
| **App Logic** | src/App.tsx | Main app using Supabase |
| **Components** | src/components/*.tsx | Uses Supabase queries |
| **Database** | supabase/migrations/*.sql | All SQL schema |
| **Config** | .env.local, .env.example | Supabase credentials |

---

## 🚀 HOW SUPABASE IS USED

### 1. Authentication Flow
```typescript
// src/lib/auth.ts
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password
});

// Creates user in Supabase Auth
// Also creates record in `users` table
```

### 2. Reading Data
```typescript
// src/App.tsx
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('is_read', false);

// Returns unread messages from database
```

### 3. Writing Data
```typescript
// src/components/DiaryEntry.tsx
await supabase
  .from('diary_entries')
  .insert([{
    date: selectedDate,
    subject: subject,
    homework: homework
  }]);

// Inserts new diary entry into database
```

### 4. Real-time Subscriptions
```typescript
// Would work with:
supabase
  .from('messages')
  .on('INSERT', payload => {
    console.log('New message:', payload);
  })
  .subscribe();

// Not implemented yet, but ready to add
```

---

## 📊 DATABASE TABLES & WHERE THEY'RE USED

| Table | Created By | Used In | Purpose |
|-------|-----------|---------|---------|
| **child_profile** | Migration 1 | App.tsx, components | Child info |
| **diary_entries** | Migration 1 | DiaryEntry.tsx | Daily entries |
| **messages** | Migration 2 | App.tsx | Parent-teacher messages |
| **announcements** | Migration 2 | App.tsx | Teacher announcements |
| **users** | Migration 3 | auth.ts, AuthContext | User accounts |
| **teacher_profiles** | Migration 3 | auth.ts | Teacher data |
| **parent_profiles** | Migration 3 | auth.ts | Parent data |
| **child_enrollments** | Migration 3 | (not yet) | Parent-Teacher-Child links |
| **message_threads** | Migration 3 | (not yet) | Message conversations |
| **sync_queue** | Migration 4 | (IndexedDB) | Offline changes |
| **sync_conflicts** | Migration 4 | (IndexedDB) | Conflict tracking |
| ... | ... | ... | ... |

---

## 🔐 ENVIRONMENT VARIABLES

**File:** `.env.local` (not in repo, create locally)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Used in:** `src/lib/supabase.ts`

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**Get from:** [app.supabase.com](https://app.supabase.com) → Settings → API

---

## 🎯 QUICK REFERENCE

### Find Code By Task

**Want to add a new database query?**
→ Edit `src/lib/auth.ts` or create new file in `src/lib/`

**Want to change database schema?**
→ Create migration file in `supabase/migrations/`

**Want to show data in UI?**
→ Add code in `src/components/*.tsx`

**Want to change auth flow?**
→ Edit `src/lib/auth.ts` or `src/contexts/AuthContext.tsx`

**Want to fix database issues?**
→ Check `supabase/migrations/*.sql`

**Want to configure Supabase settings?**
→ Go to [app.supabase.com](https://app.supabase.com)

---

## 📞 EXAMPLE: ADDING A NEW FEATURE

Let's say you want to "Send a message to teacher"

### Step 1: Add Supabase Query
**File:** `src/lib/auth.ts` or new `src/lib/messaging.ts`

```typescript
export const messaging = {
  async sendMessage(threadId: string, content: string, senderId: string) {
    const { data, error } = await supabase
      .from('message_threads')  // ← Uses database table
      .insert([{
        thread_id: threadId,
        sender_id: senderId,
        content: content,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    return data;
  }
}
```

### Step 2: Use in Component
**File:** `src/components/MessageForm.tsx`

```typescript
import { messaging } from '../lib/messaging';

function MessageForm() {
  const handleSend = async () => {
    await messaging.sendMessage(threadId, content, userId);
  }
}
```

### Step 3: Data appears in Supabase!
- New row in `message_threads` table
- Visible in Supabase dashboard
- Can be queried by other users

---

## ✅ CHECKLIST: WHERE ALL CODE IS

- [x] **Client initialization** → `src/lib/supabase.ts`
- [x] **Auth functions** → `src/lib/auth.ts`
- [x] **Auth state** → `src/contexts/AuthContext.tsx`
- [x] **Database queries** → Throughout `src/` in various files
- [x] **Database schema** → `supabase/migrations/*.sql`
- [x] **Environment** → `.env.local` (create manually)
- [x] **Components** → `src/components/*.tsx`
- [x] **Types** → `src/lib/supabase.ts` & inline

---

## 🎉 SUMMARY

All Supabase code runs in one of these locations:

1. **Frontend TypeScript** (`src/` folder)
   - Calls Supabase client
   - Sends queries
   - Displays results

2. **Database Layer** (`supabase/migrations/` folder)
   - Defines tables
   - Sets up security
   - Creates indexes

3. **Configuration** (`.env.local`, Supabase dashboard)
   - API credentials
   - Auth settings
   - RLS policies

**Everything is connected!** 🔗

---

## 🚀 NEXT: Apply Migrations

Before you can use the new tables (users, teacher_profiles, etc.), you must:

```bash
cd /home/mike/Downloads/my-child-ediary-main
supabase db push
```

Then all code that references these tables will work! ✅
