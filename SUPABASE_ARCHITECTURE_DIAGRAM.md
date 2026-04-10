# 🗺️ SUPABASE CODE ARCHITECTURE DIAGRAM

## 📊 Complete Code Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE INFRASTRUCTURE                      │
│                   (Cloud Database & Auth)                       │
│                 https://app.supabase.com                        │
│                                                                 │
│  ├─ Database (PostgreSQL)                                       │
│  │  ├─ users                                                    │
│  │  ├─ teacher_profiles                                         │
│  │  ├─ parent_profiles                                          │
│  │  ├─ child_profile                                            │
│  │  ├─ diary_entries                                            │
│  │  ├─ messages                                                 │
│  │  ├─ announcements                                            │
│  │  └─ ... (15 more tables)                                     │
│  │                                                              │
│  ├─ Auth (Email/Password)                                       │
│  │  └─ auth.users (built-in Supabase table)                     │
│  │                                                              │
│  └─ RLS Policies (Security)                                     │
│     └─ Control who sees what                                    │
└─────────────────────────────────────────────────────────────────┘
        ↑                                                    ↑
        │ HTTP Requests (Queries, Updates)                 │
        │ JSON/REST API                                     │
        │                                                    │
┌───────┴─────────────────────────────────────────────────┴────────┐
│                    YOUR REACT APP                                │
│            /home/mike/Downloads/my-child-ediary-main/            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    src/main.tsx                           │   │
│  │            (App Entry Point)                             │   │
│  │  - Renders <AuthProvider><App/></AuthProvider>           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            src/contexts/AuthContext.tsx                  │   │
│  │         (Global Authentication State)                    │   │
│  │                                                           │   │
│  │  import { supabase } from '../lib/supabase'              │   │
│  │  import { authService } from '../lib/auth'              │   │
│  │                                                           │   │
│  │  - Tracks: user, isLoggedIn, loading                     │   │
│  │  - Calls: supabase.auth.getSession()                     │   │
│  │  - Calls: authService.signIn/signUp()                    │   │
│  │  - Listens: onAuthStateChange()                          │   │
│  │  - Exports: useAuth() hook                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              src/App.tsx                                 │   │
│  │         (Main Application Logic)                         │   │
│  │                                                           │   │
│  │  import { supabase } from './lib/supabase'              │   │
│  │  import { useAuth } from './contexts/AuthContext'       │   │
│  │                                                           │   │
│  │  - Calls: supabase.from('messages').select()            │   │
│  │  - Calls: supabase.from('announcements').select()       │   │
│  │  - Calls: supabase.from('child_profile').select()       │   │
│  │  - Uses: useAuth() to check if user logged in           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            src/components/*.tsx                          │   │
│  │       (UI Components Using Supabase)                     │   │
│  │                                                           │   │
│  │  ├─ DiaryEntry.tsx                                       │   │
│  │  │  ├─ const { data } = await supabase                  │   │
│  │  │  │   .from('diary_entries')                          │   │
│  │  │  │   .select('*')                                     │   │
│  │  │  │                                                    │   │
│  │  │  └─ await supabase.from('diary_entries').insert()    │   │
│  │  │                                                        │   │
│  │  ├─ ProfileSetup.tsx                                     │   │
│  │  │  └─ await supabase.from('child_profile').insert()    │   │
│  │  │                                                        │   │
│  │  ├─ Messages.tsx                                         │   │
│  │  │  └─ const { data } = await supabase                  │   │
│  │  │     .from('messages').select('*')                    │   │
│  │  │                                                        │   │
│  │  └─ Announcements.tsx                                    │   │
│  │     └─ const { data } = await supabase                  │   │
│  │        .from('announcements').select('*')               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        src/lib/ (Library Functions)                       │   │
│  │                                                           │   │
│  │  ├─ supabase.ts                                          │   │
│  │  │  ├─ export const supabase = createClient(...)         │   │
│  │  │  ├─ export interface ChildProfile { ... }            │   │
│  │  │  ├─ export interface DiaryEntry { ... }              │   │
│  │  │  ├─ export interface Message { ... }                 │   │
│  │  │  └─ export interface Announcement { ... }            │   │
│  │  │                                                        │   │
│  │  ├─ auth.ts                                              │   │
│  │  │  ├─ export const authService = {                      │   │
│  │  │  │   signUpTeacher()                                  │   │
│  │  │  │   signUpParent()                                   │   │
│  │  │  │   signIn()                                         │   │
│  │  │  │   signOut()                                        │   │
│  │  │  │   getCurrentUser()                                 │   │
│  │  │  │   getTeacherProfile()                              │   │
│  │  │  │   getParentProfile()                               │   │
│  │  │  │ }                                                   │   │
│  │  │  └─ All functions use: supabase.auth.* or            │   │
│  │  │     supabase.from().insert/update/select              │   │
│  │  │                                                        │   │
│  │  ├─ indexedDb.ts                                         │   │
│  │  │  └─ Local offline storage (uses Dexie)               │   │
│  │  │                                                        │   │
│  │  ├─ syncQueue.ts                                         │   │
│  │  │  └─ Track pending changes                             │   │
│  │  │                                                        │   │
│  │  └─ offlineSync.ts                                       │   │
│  │     └─ Sync local data with Supabase                     │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        .env.local (Configuration)                        │   │
│  │                                                           │   │
│  │  VITE_SUPABASE_URL=https://...supabase.co               │   │
│  │  VITE_SUPABASE_ANON_KEY=eyJ...                          │   │
│  │                                                           │   │
│  │  ↓ Used by src/lib/supabase.ts                           │   │
│  │  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL  │   │
│  │  const supabaseAnonKey = ...VITE_SUPABASE_ANON_KEY      │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              DATABASE MIGRATIONS (SQL Scripts)                   │
│         supabase/migrations/ (Runs automatically)                │
│                                                                  │
│  ├─ 20260408085639_create_mychild_diary_schema.sql              │
│  │  ├─ CREATE TABLE child_profile                              │
│  │  ├─ CREATE TABLE diary_entries                              │
│  │  ├─ CREATE INDEX idx_diary_entries_date                     │
│  │  └─ ALTER TABLE ENABLE ROW LEVEL SECURITY                   │
│  │                                                              │
│  ├─ 20260408090000_add_communication_features.sql               │
│  │  ├─ CREATE TABLE messages                                   │
│  │  ├─ CREATE TABLE announcements                              │
│  │  └─ CREATE POLICY (RLS)                                     │
│  │                                                              │
│  ├─ 20260408091000_add_parent_teacher_connection_system.sql     │
│  │  ├─ CREATE TABLE users                                      │
│  │  ├─ CREATE TABLE teacher_profiles                           │
│  │  ├─ CREATE TABLE parent_profiles                            │
│  │  ├─ CREATE TABLE child_enrollments                          │
│  │  ├─ CREATE TABLE connection_requests                        │
│  │  ├─ CREATE TABLE message_threads                            │
│  │  ├─ CREATE TABLE entry_approvals                            │
│  │  ├─ ... (more tables)                                       │
│  │  └─ CREATE POLICY (RLS on all tables)                       │
│  │                                                              │
│  └─ 20260408092000_add_offline_sync_tables.sql                  │
│     ├─ CREATE TABLE sync_queue                                 │
│     ├─ CREATE TABLE sync_conflicts                             │
│     ├─ CREATE TABLE sync_metadata                              │
│     ├─ CREATE TABLE record_versions                            │
│     ├─ CREATE FUNCTION (helpers)                               │
│     └─ CREATE VIEW (materialized views)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW EXAMPLE: User Login

```
User clicks "Login" button
        ↓
LoginPage.tsx calls: authService.signIn(email, password)
        ↓
auth.ts calls: supabase.auth.signInWithPassword()
        ↓
HTTP Request to Supabase Cloud
        ↓
Supabase checks auth.users table
        ↓
HTTP Response back to browser
        ↓
supabase.auth.onAuthStateChange() triggers
        ↓
AuthContext.tsx updates user state
        ↓
Components using useAuth() re-render
        ↓
App shows logged-in UI
```

---

## 🔄 DATA FLOW EXAMPLE: Save Diary Entry

```
Teacher fills diary form and clicks "Save"
        ↓
DiaryEntry.tsx calls: supabase
  .from('diary_entries')
  .insert([{ date, subject, homework, ... }])
        ↓
HTTP POST Request to Supabase API
        ↓
Supabase PostgreSQL database receives INSERT
        ↓
RLS Policy checks if user allowed
        ↓
Row inserted into diary_entries table
        ↓
HTTP Response: success { id: "...", ... }
        ↓
DiaryEntry.tsx updates local state
        ↓
UI shows "Saved!" message
        ↓
Data visible in Supabase Dashboard → Table Editor
```

---

## 🔄 DATA FLOW EXAMPLE: Fetch Messages

```
App.tsx loads or user clicks "Messages" tab
        ↓
App.tsx calls: supabase
  .from('messages')
  .select('id')
  .eq('is_read', false)
        ↓
HTTP GET Request to Supabase API
        ↓
Supabase checks: WHERE is_read = false AND user has access (RLS)
        ↓
Returns matching rows from messages table
        ↓
HTTP Response: [{ id: 1, ... }, { id: 2, ... }]
        ↓
App.tsx receives data
        ↓
Component renders Message list
        ↓
User sees unread message count
```

---

## 🔐 SECURITY FLOW: Row-Level Security (RLS)

```
User makes query to Supabase
        ↓
Supabase gets auth.uid() from JWT token
        ↓
Supabase checks RLS Policies:
  "Can this user_id see this row?"
        ↓
If YES → Return data
If NO  → Return error or empty results
        ↓
Example Policy (messages table):
  CREATE POLICY "users_see_their_messages"
    ON messages
    FOR SELECT
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());
        ↓
Teacher cannot see Parent's private messages
Parent cannot see other Parent's messages
Only participants can see message threads
```

---

## 📦 FILE ORGANIZATION SUMMARY

```
Frontend Layer (React)
├── UI Components (Render HTML)
│   └── Use: supabase.from(...).select()
├── Logic Layer (Business Logic)
│   ├── authService (auth.ts)
│   ├── OfflineSync (indexedDb.ts)
│   └── SyncQueue (syncQueue.ts)
└── State Layer (Global State)
    └── AuthContext.tsx (using useAuth())

↓ HTTP/REST API

Backend Layer (Supabase Cloud)
├── Authentication (Supabase Auth)
│   └── auth.users table
├── Database (PostgreSQL)
│   └── 19 custom tables
├── Security (RLS Policies)
│   └── auth.uid() checks
└── Migrations (SQL Scripts)
    └── supabase/migrations/*.sql
```

---

## ✨ CODE EXECUTION PATH

```
Component renders
  → Imports: import { supabase } from '../../lib/supabase'
  → Calls: supabase.from('table_name').select()
  → Creates: REST API request to https://xxx.supabase.co/rest/v1/table_name
  → Supabase receives: HTTP request with JWT auth token
  → Checks: RLS policy for auth.uid()
  → Executes: SQL query SELECT * FROM table_name WHERE ...
  → Returns: JSON response with results
  → Component receives: [{ id: 1, ... }, ...]
  → Component state updates
  → Component re-renders with new data
```

---

## 🎯 QUICK LOOKUP

| I want to... | I edit this file |
|--------------|------------------|
| Change what data loads | src/App.tsx or src/components/*.tsx |
| Add auth logic | src/lib/auth.ts |
| Change auth flow | src/contexts/AuthContext.tsx |
| Add database table | supabase/migrations/new-migration.sql |
| Add app-wide state | src/contexts/AuthContext.tsx (or new context) |
| Add library function | src/lib/*.ts |
| Configure Supabase | .env.local and https://app.supabase.com |
| Handle offline | src/lib/indexedDb.ts + syncQueue.ts |

---

## 🚀 NEXT STEPS

1. **Apply migrations:** `supabase db push`
2. **Update types:** Add new interfaces to src/lib/supabase.ts
3. **Create API functions:** Add to src/lib/auth.ts or new files
4. **Update components:** Use new Supabase tables in React components
5. **Test:** Use Supabase dashboard to verify data

Everything is set up and ready! 🎉
