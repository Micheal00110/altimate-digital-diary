# How to Apply Database Migrations to Supabase

## 📋 Overview

I've created 2 new migration files that add all the tables needed for:
1. **Parent-Teacher Connection System** (authentication, profiles, connections)
2. **Offline Sync Support** (sync queue, conflict tracking, history)

---

## 🗂️ Migration Files Created

### 1. `20260408091000_add_parent_teacher_connection_system.sql`
**Tables Created:**
- `users` - User accounts (teachers, parents, admins)
- `teacher_profiles` - Teacher details & verification
- `parent_profiles` - Parent details
- `child_profiles` - Child information
- `child_enrollments` - Links child to parent & teacher
- `connection_requests` - Parent finds teacher system
- `message_threads` - Conversation groups
- `messages` - Individual messages
- `diary_entries` - Enhanced diary with relations
- `entry_approvals` - Track parent signatures
- `announcements` - School announcements
- `reports` - User reports (moderation)
- `blocked_users` - Safety blocking
- `sync_queue` - Offline sync queue
- `sync_conflicts` - Conflict tracking

**Features:**
- ✅ Row-Level Security (RLS) policies included
- ✅ Proper foreign keys with cascading deletes
- ✅ Indexes for performance
- ✅ Automatic `updated_at` timestamps
- ✅ Check constraints for data validation

### 2. `20260408092000_add_offline_sync_tables.sql`
**Tables Created:**
- `sync_metadata` - Track sync status per user
- `sync_history` - Audit trail of syncs
- `offline_cache_metadata` - What's cached locally
- `record_versions` - Version history for conflicts

**Features:**
- ✅ Materialized views for common queries
- ✅ Helper functions for sync operations
- ✅ Performance indexes
- ✅ Automatic triggers
- ✅ Utility functions: `mark_user_changes_as_synced()`, `resolve_conflict()`, etc.

---

## 🚀 How to Apply Migrations

### Option 1: Using Supabase Dashboard (Easy)

1. Go to **[https://app.supabase.com](https://app.supabase.com)**
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy & paste the entire contents of:
   - `20260408091000_add_parent_teacher_connection_system.sql`
6. Click **"Run"**
7. Wait for success message ✅
8. Repeat for `20260408092000_add_offline_sync_tables.sql`

### Option 2: Using Supabase CLI (Recommended)

```bash
# Navigate to your project
cd /home/mike/Downloads/my-child-ediary-main

# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push

# View migration status
supabase migration list
```

### Option 3: Using Migration System

If you're using Supabase's managed migrations:

1. Files are already in `supabase/migrations/`
2. Supabase will auto-detect and run them on next deploy
3. Or manually trigger via CLI: `supabase db push`

---

## ✅ Verify Migrations Were Applied

### Via Dashboard:
1. Go to **SQL Editor**
2. Run this query:

```sql
-- List all tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

You should see all these tables:
```
announcements
blocked_users
child_enrollments
child_profiles
connection_requests
diary_entries
entry_approvals
message_threads
messages
offline_cache_metadata
parent_profiles
record_versions
reports
sync_conflicts
sync_history
sync_metadata
sync_queue
teacher_profiles
users
```

### Via CLI:
```bash
supabase db push --dry-run  # See what would be applied
supabase migration list     # See applied migrations
```

---

## 🔍 What Each Table Does

### User Management
| Table | Purpose |
|-------|---------|
| `users` | Core user accounts with email/password |
| `teacher_profiles` | Teacher credentials & verification status |
| `parent_profiles` | Parent information & relationship to child |

### Connections
| Table | Purpose |
|-------|---------|
| `child_enrollments` | Links child to specific teacher & parent(s) |
| `connection_requests` | Parent requests to connect with teacher |
| `blocked_users` | Safety - block unwanted connections |

### Communication
| Table | Purpose |
|-------|---------|
| `message_threads` | Conversation groups between parent & teacher |
| `messages` | Individual messages with read status |
| `announcements` | Teacher-posted announcements |

### Diary Management
| Table | Purpose |
|-------|---------|
| `diary_entries` | Daily entries from teacher for child |
| `entry_approvals` | Parent signatures & approvals |

### Offline Sync
| Table | Purpose |
|-------|---------|
| `sync_queue` | Pending changes to upload when online |
| `sync_conflicts` | Conflicting changes needing user resolution |
| `sync_metadata` | Last sync timestamp & status |
| `sync_history` | Audit log of all sync operations |
| `record_versions` | Version history for 3-way merge |
| `offline_cache_metadata` | What data is cached locally |

### Moderation
| Table | Purpose |
|-------|---------|
| `reports` | User reports (inappropriate behavior) |

---

## 🔐 Security Notes

### RLS (Row-Level Security) Enabled
All tables have RLS policies that:
- ✅ Allow users to only see their own data
- ✅ Prevent teachers from seeing other teachers' data
- ✅ Prevent parents from seeing unrelated children
- ✅ Require authentication via `auth.uid()`

### Important: Auth Setup Required
These tables use `auth.uid()` in RLS policies, which requires:

1. **Enable Supabase Auth:**
   - Dashboard → Authentication → Settings
   - Enable Email/Password provider

2. **Update RLS if needed:**
   - Start permissive during development
   - Tighten policies before production

3. **Test RLS:**
```sql
-- This shows what current user (auth.uid()) can see
SELECT * FROM users WHERE id = auth.uid();
```

---

## 🗑️ If You Need to Undo

### Drop All Tables (WARNING: Data Loss!)

```sql
-- Only if needed - this deletes everything!
DROP TABLE IF EXISTS sync_conflicts CASCADE;
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS sync_history CASCADE;
DROP TABLE IF EXISTS sync_metadata CASCADE;
DROP TABLE IF EXISTS offline_cache_metadata CASCADE;
DROP TABLE IF EXISTS record_versions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS entry_approvals CASCADE;
DROP TABLE IF EXISTS diary_entries CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_threads CASCADE;
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS child_enrollments CASCADE;
DROP TABLE IF EXISTS child_profiles CASCADE;
DROP TABLE IF EXISTS parent_profiles CASCADE;
DROP TABLE IF EXISTS teacher_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### Via CLI:
```bash
supabase db reset  # Resets entire database
```

---

## 📊 Database Schema Diagram

```
users (core auth)
  ├── teacher_profiles
  │   └── child_enrollments ←→ parent_profiles
  │       ├── diary_entries
  │       │   └── entry_approvals
  │       └── message_threads
  │           └── messages
  │
  ├── connection_requests
  │
  ├── announcements
  │
  ├── reports
  │
  └── blocked_users

Offline Sync:
  ├── sync_queue (pending changes)
  ├── sync_conflicts (conflicts to resolve)
  ├── sync_metadata (last sync time)
  ├── sync_history (audit trail)
  ├── record_versions (version history)
  └── offline_cache_metadata (what's cached)
```

---

## 🎯 Next Steps

1. ✅ **Apply these migrations** to your Supabase database
2. ✅ **Verify they worked** (see Verify section above)
3. ⏳ **Update your API types** in `src/lib/supabase.ts`
4. ⏳ **Create service functions** for each table
5. ⏳ **Update UI components** to use new tables

---

## 🆘 Troubleshooting

### Error: "Permission denied"
- Make sure you're logged in: `supabase login`
- Check your project permissions

### Error: "Column already exists"
- Some tables might already exist
- Use `IF NOT EXISTS` (already included in migrations)
- Or drop and recreate

### RLS Policy Errors
- Development: Start with permissive policies
- Use `SELECT 1` to bypass RLS for testing:
```sql
SET SESSION AUTHORIZATION none;  -- Disable RLS
```

### Foreign Key Conflicts
- Ensure child tables created before parent references
- Migration order: users → profiles → enrollments → messages
- Already handled in migration files ✅

---

## 📚 Documentation Files

These explain the implementation:
- `OFFLINE_SYNC_ANALYSIS.md` - Architecture details
- `PARENT_TEACHER_CONNECTION_TODO.md` - Phase-by-phase plan
- `OFFLINE_SYNC_STATUS.md` - Current implementation status

---

## ✨ Ready?

Run migrations now:

```bash
# Option 1: CLI
supabase db push

# Option 2: Manual SQL Editor
# Copy contents of migration files into Supabase SQL Editor
```

Then verify all tables exist! 🚀
