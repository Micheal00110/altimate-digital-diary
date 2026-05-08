# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyChild Diary is a parent-teacher communication app for tracking children's school activities. It features offline-first architecture with Supabase backend sync, dual-role authentication (teacher/parent), and real-time conflict resolution.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Offline Storage**: Dexie (IndexedDB wrapper)
- **Icons**: lucide-react

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm typecheck    # TypeScript type checking
pnpm preview      # Preview production build
```

## Architecture

### Authentication Flow
- Supabase Auth handles session management
- `src/lib/auth.ts` - Auth service with dual-role support (teacher/parent)
- `src/contexts/AuthContext.tsx` - React Context for auth state
- `src/hooks/useAuth.ts` - Hook to access auth context

### Offline-First Pattern
1. All data operations go through `src/lib/offlineSync.ts`
2. Data is stored locally in IndexedDB via Dexie (`src/lib/indexedDb.ts`)
3. A sync queue (`src/lib/syncQueue.ts`, `src/lib/syncEngine.ts`) tracks pending changes
4. On reconnection, queued items are pushed to Supabase with conflict detection

### Key Modules

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client initialization + type exports |
| `src/lib/auth.ts` | signUpTeacher, signUpParent, password reset |
| `src/lib/syncEngine.ts` | Queue processor with retry/conflict logic |
| `src/lib/offlineSync.ts` | Download/upload data between Supabase and IndexedDB |
| `src/lib/indexedDb.ts` | Dexie database schema + helper methods |
| `src/contexts/AuthContext.tsx` | Auth provider wrapping the app |
| `src/contexts/SyncContext.tsx` | Sync state management |

### Database Migrations
SQL migrations in `supabase/migrations/` apply schema changes. Key tables:
- `child_profile` / `child_profiles` - Child profiles (dual table names exist for legacy compatibility)
- `diary_entries` - Daily diary records
- `messages` - Parent-teacher messages
- `announcements` - School announcements
- `users` - User accounts with roles

### Component Structure
- `src/components/` - UI components (DiaryEntry, Messages, Announcements, Login/Signup flows)
- `src/App.tsx` - Main app with view routing and notification badges

### Environment Variables
```
VITE_SUPABASE_URL    # Supabase project URL
VITE_SUPABASE_ANON_KEY  # Supabase anonymous key
```

If missing, the app uses a mock Supabase client that throws errors on auth/database calls.

## Code Patterns

- Components are default exports
- Hooks use `use` prefix (e.g., `useAuth`, `useOfflineData`)
- Contexts wrap the app in `main.tsx`
- Sync operations return `{ success, error }` result objects
