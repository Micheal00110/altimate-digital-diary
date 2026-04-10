# 🎯 SUPABASE CODE - QUICK REFERENCE

## ⚡ TL;DR - WHERE IS EVERYTHING?

### Database Schema (SQL)
```
/supabase/migrations/
├── 20260408085639_create_mychild_diary_schema.sql
├── 20260408090000_add_communication_features.sql
├── 20260408091000_add_parent_teacher_connection_system.sql
└── 20260408092000_add_offline_sync_tables.sql
```
**Action:** `supabase db push` to deploy

### Supabase Client (Initialized Here)
```
/src/lib/supabase.ts
├── Creates Supabase client
├── Defines TypeScript interfaces
└── Gets credentials from .env.local
```
**Used in:** Every component that talks to Supabase

### Auth Service (All Auth Functions)
```
/src/lib/auth.ts
├── signUpTeacher()
├── signUpParent()
├── signIn()
├── signOut()
├── getCurrentUser()
└── getTeacherProfile() / getParentProfile()
```
**Called from:** AuthContext, login components

### Auth State (Global Auth)
```
/src/contexts/AuthContext.tsx
├── Tracks: current user, loading state, session
├── Provides: useAuth() hook
└── Listens: supabase.auth.onAuthStateChange()
```
**Used in:** Wrapped around entire App in main.tsx

### Main App (Uses Supabase)
```
/src/App.tsx
├── Loads notifications: supabase.from('messages').select()
├── Loads announcements: supabase.from('announcements').select()
└── Checks profile: supabase.from('child_profile').select()
```

### Components (Use Supabase)
```
/src/components/
├── DiaryEntry.tsx → supabase.from('diary_entries')
├── ProfileSetup.tsx → supabase.from('child_profile').insert()
├── Messages.tsx → supabase.from('messages')
└── Announcements.tsx → supabase.from('announcements')
```

### Configuration
```
/.env.local (create manually)
├── VITE_SUPABASE_URL=https://...supabase.co
└── VITE_SUPABASE_ANON_KEY=eyJ...
```
**Get from:** https://app.supabase.com → Settings → API

---

## 🔍 5-SECOND GUIDE

**Frontend** = React components using Supabase client  
**Backend** = PostgreSQL database in Supabase cloud  
**Connector** = `src/lib/supabase.ts` creates the client  
**Auth** = `src/lib/auth.ts` handles login/signup  
**State** = `src/contexts/AuthContext.tsx` manages user  
**Schema** = `supabase/migrations/` SQL files define tables  
**Config** = `.env.local` stores credentials

---

## 🎬 HOW IT WORKS (1 Minute)

```
1. Browser loads app
   ↓
2. main.tsx wraps App in <AuthProvider>
   ↓
3. AuthContext.tsx calls supabase.auth.getSession()
   ↓
4. src/lib/supabase.ts (client) makes HTTP request
   ↓
5. Supabase cloud responds with user session
   ↓
6. AuthContext updates useAuth() state
   ↓
7. Components render based on auth state
   ↓
8. When user interacts (click button):
   - Component calls supabase.from('table').select()
   - HTTP request sent to Supabase
   - Database query runs
   - Response returned
   - Component state updated
   - UI re-renders
```

---

## 📚 FILE-BY-FILE REFERENCE

### 1. src/lib/supabase.ts
```typescript
// This file:
// - Creates Supabase client
// - Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local
// - Exports TypeScript interfaces for tables

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Used by:** Everywhere that needs to query Supabase

---

### 2. src/lib/auth.ts
```typescript
// This file:
// - Wraps Supabase Auth methods
// - Handles teacher/parent signup
// - Handles login/logout
// - Gets user profiles

export const authService = {
  async signUpTeacher(data, password) {
    // 1. supabase.auth.signUp() - creates auth user
    // 2. supabase.from('teacher_profiles').insert() - creates profile
  },
  
  async signIn(email, password) {
    // supabase.auth.signInWithPassword()
  },
  
  async getTeacherProfile(userId) {
    // supabase.from('teacher_profiles').select()
  }
}
```

**Called by:** Login/signup components, AuthContext

---

### 3. src/contexts/AuthContext.tsx
```typescript
// This file:
// - Provides global auth state
// - Tracks current user
// - Handles session persistence
// - Exports useAuth() hook

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Call supabase.auth.getSession()
    // Setup supabase.auth.onAuthStateChange()
    // Update user state
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, useAuth }}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // Returns { user, login, logout, ... }
}
```

**Wraps:** Entire app in `src/main.tsx`

---

### 4. src/App.tsx
```typescript
// This file:
// - Main app component
// - Uses supabase directly for queries
// - Uses useAuth() for user state

function App() {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    // Query 1: Get child profile
    const { data } = await supabase
      .from('child_profile')
      .select('*')
      .maybeSingle();
    
    // Query 2: Get unread messages count
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('is_read', false);
  }, []);
}
```

**Queries:**
- `supabase.from('child_profile').select()`
- `supabase.from('messages').select()`
- `supabase.from('announcements').select()`

---

### 5. src/components/DiaryEntry.tsx
```typescript
// This file:
// - Displays diary entry form
// - Loads entry from database
// - Saves entry to database

async function loadEntry() {
  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('date', selectedDate)
    .maybeSingle();
}

async function saveEntry() {
  const { error } = await supabase
    .from('diary_entries')
    .insert([{ date, subject, homework }]);
}
```

**Queries:**
- SELECT from diary_entries
- INSERT into diary_entries
- UPDATE diary_entries

---

### 6. supabase/migrations/
```sql
-- Migration 1: Basic schema
CREATE TABLE child_profile (
  id SERIAL PRIMARY KEY,
  name TEXT,
  grade TEXT,
  school TEXT
);

CREATE TABLE diary_entries (
  id SERIAL PRIMARY KEY,
  date TEXT UNIQUE,
  subject TEXT,
  homework TEXT
);

-- Migration 2: Add messaging
CREATE TABLE messages (...);
CREATE TABLE announcements (...);

-- Migration 3: Add auth & connections
CREATE TABLE users (...);
CREATE TABLE teacher_profiles (...);
CREATE TABLE parent_profiles (...);
CREATE TABLE child_enrollments (...);
...

-- Migration 4: Add offline sync
CREATE TABLE sync_queue (...);
CREATE TABLE sync_conflicts (...);
...
```

**Action:** `supabase db push` to apply all migrations

---

### 7. .env.local
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to get:**
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy Project URL and anon key
5. Paste into .env.local

---

## 🔐 SECURITY (RLS Policies)

All tables have RLS enabled in migrations:

```sql
-- Only users can see their own data
CREATE POLICY "Users see own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Teachers see connected parents' data only
CREATE POLICY "Teachers see enrolled children" ON diary_entries
  FOR SELECT
  USING (auth.uid() = teacher_id);

-- Parents see their enrolled children only
CREATE POLICY "Parents see their children" ON diary_entries
  FOR SELECT
  USING (child_id IN (SELECT child_id FROM enrollments WHERE parent_id = auth.uid()));
```

**How it works:**
- Every query includes `auth.uid()` (current user's ID)
- RLS policy checks if user is allowed to see data
- Unauthorized queries return empty or error

---

## 🚀 COMMON TASKS

### Read Data
```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .order('created_at', { ascending: false });
```

### Write Data
```typescript
const { data, error } = await supabase
  .from('diary_entries')
  .insert([{ date, subject, homework }]);
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('child_profile')
  .update({ name: 'New Name' })
  .eq('id', profileId);
```

### Delete Data
```typescript
const { data, error } = await supabase
  .from('messages')
  .delete()
  .eq('id', messageId);
```

### Real-time Listen
```typescript
const subscription = supabase
  .from('messages')
  .on('INSERT', payload => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

### Authenticate
```typescript
// Signup
const { user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// Login
const { user, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Logout
await supabase.auth.signOut();
```

---

## ✅ BEFORE YOU START

- [ ] Create `.env.local` with Supabase credentials
- [ ] Run `supabase db push` to apply migrations
- [ ] Verify tables exist in Supabase dashboard
- [ ] Enable Email/Password auth in Supabase
- [ ] Test login/signup works

---

## 🎯 NEXT STEPS

1. **Apply migrations:** `supabase db push`
2. **Create .env.local** with your credentials
3. **Update types** in `src/lib/supabase.ts`
4. **Create API functions** in `src/lib/`
5. **Update components** to use new tables
6. **Test** in browser

---

## 📞 HELPFUL LINKS

| Need | Go To |
|------|-------|
| Supabase Dashboard | https://app.supabase.com |
| Get API Keys | Settings → API |
| View Tables | Table Editor |
| Run SQL | SQL Editor |
| Check Auth | Authentication → Users |
| View Logs | Logs in sidebar |

---

## 🎉 THAT'S IT!

All Supabase code in your project follows this pattern:

```
Component → supabase.from('table').select() → Database → Response → Update UI
```

Everything is set up and ready to use! 🚀

See also:
- SUPABASE_CODE_LOCATIONS.md (Detailed breakdown)
- SUPABASE_ARCHITECTURE_DIAGRAM.md (Visual guide)
- PARENT_TEACHER_CONNECTION_TODO.md (What to build next)
