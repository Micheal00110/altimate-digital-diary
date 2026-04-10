# Offline-First Architecture with Synchronization - Analysis & Planning

## Executive Summary
Your app needs offline capability so teachers and parents can work when disconnected, then automatically sync changes when reconnected. This document outlines the architecture, challenges, and implementation strategy.

---

## Current State Analysis

### What Exists
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Data Model**: 4 tables (child_profile, diary_entries, messages, announcements)
- **Current Architecture**: Online-only, real-time queries to Supabase

### Pain Points
- **No offline access**: App crashes without internet
- **No conflict resolution**: If teacher & parent edit same entry offline → data loss
- **No sync queue**: Changes lost if disconnected mid-operation
- **No replication**: All data fetched on-demand (inefficient for offline)

---

## Architecture Design

### 1. **Local Storage Layer** (IndexedDB)
**Why IndexedDB over localStorage?**
- localStorage: 5-10MB limit, synchronous (blocks UI)
- IndexedDB: 50MB+ limit, async operations, better for large datasets

**Store Structure:**
```
Database: "child-ediary-offline"
├── ObjectStore: "child_profile"
│   └── keyPath: "id"
├── ObjectStore: "diary_entries"
│   ├── keyPath: "id"
│   └── indexes: ["date", "sync_status"]
├── ObjectStore: "messages"
│   ├── keyPath: "id"
│   └── indexes: ["is_read", "sender_type"]
├── ObjectStore: "announcements"
│   ├── keyPath: "id"
│   └── indexes: ["created_at"]
└── ObjectStore: "sync_queue"
    ├── keyPath: "id"
    └── stores: [{operation: "INSERT", table: "diary_entries", data: {...}, timestamp: ...}]
```

### 2. **Sync Queue System**
**Purpose**: Track all changes made offline

**Queue Item Structure:**
```typescript
interface SyncQueueItem {
  id: string; // uuid
  table: string; // "diary_entries" | "messages" | etc
  operation: "CREATE" | "UPDATE" | "DELETE";
  data: Record<string, any>;
  timestamp: number; // when created locally
  attempt: number; // retry count
  status: "pending" | "syncing" | "synced" | "failed";
  error?: string;
}
```

### 3. **Conflict Resolution Strategy**

**Scenario 1: Same Field Edited Offline by Two People**
- Teacher adds homework offline
- Parent adds homework offline
- **Solution**: Last-write-wins with timestamp + manual conflict UI

**Scenario 2: Teacher Comment Updated on Server While Parent Editing**
- **Solution**: Three-way merge (server, client, local) + conflict notification

**Implementation:**
```typescript
interface ConflictResolution {
  field: string;
  local: any;
  remote: any;
  server: any;
  resolution: "local" | "remote" | "merge"; // user chooses
  resolvedValue: any;
}
```

### 4. **Network State Management**

**Events to Track:**
- `online` / `offline` (navigator.onLine)
- Connection quality (bandwidth detection)
- Latency monitoring

**State Machine:**
```
ONLINE → (disconnect) → SYNC_IN_PROGRESS → (conflicts?) → CONFLICT_RESOLUTION
                                          ↓ (success)
                                        SYNCED
                     ↑
                  (reconnect)
OFFLINE ←────────────────────────────────
```

---

## Implementation Roadmap (TODO List)

### Phase 1: Foundation (2-3 days)
1. **Create IndexedDB Service**
   - Write `src/lib/indexedDb.ts`
   - Implement database initialization
   - Create CRUD operations wrapper

2. **Create Sync Queue Service**
   - Write `src/lib/syncQueue.ts`
   - Queue item creation
   - Queue persistence

3. **Create Network State Context**
   - Write `src/contexts/NetworkContext.tsx`
   - Track online/offline status
   - Expose sync state to app

### Phase 2: Data Synchronization (3-4 days)
4. **Implement Read Sync (Offline Hydration)**
   - Write `src/lib/offlineSync.ts`
   - When app loads: download all tables to IndexedDB
   - Implement smart partial sync (delta sync)

5. **Implement Write Sync (Upload Queue)**
   - Create sync engine
   - Send queued operations to Supabase
   - Handle server responses
   - Update local cache

6. **Implement Conflict Detection**
   - Compare local vs remote vs server versions
   - Flag conflicts for user review
   - Provide resolution UI

### Phase 3: Conflict Resolution UI (2-3 days)
7. **Create Conflict Resolution Modal**
   - Write `src/components/ConflictResolver.tsx`
   - Display conflicting versions
   - Allow user to choose/merge

8. **Update DiaryEntry Component**
   - Fall back to IndexedDB on offline
   - Show sync status
   - Handle conflict notifications

### Phase 4: Edge Cases & Polish (2-3 days)
9. **Handle Edge Cases**
   - Stale data detection
   - Retries with exponential backoff
   - Concurrent writes to same record
   - Large data syncing (pagination)

10. **Add Sync UI Indicators**
   - Sync status badge
   - Queue size indicator
   - Last sync timestamp
   - Conflict warnings

11. **Testing & Optimization**
   - Offline mode testing (DevTools)
   - Conflict scenario testing
   - Performance optimization
   - Memory management

---

## Data Flow Diagrams

### Read Flow (Loading Data)
```
App Boots
  ↓
Is Online? 
  ├─ YES → Fetch from Supabase → Store in IndexedDB → Return
  └─ NO  → Fetch from IndexedDB → Return

Periodic Sync (every 1 min when offline):
  → Try to fetch updates from Supabase
  → Merge with local → Update IndexedDB
```

### Write Flow (Saving Data)
```
User Saves Diary Entry
  ↓
Is Online?
  ├─ YES → Send to Supabase → Get response → Store in IndexedDB → Success
  │         If conflict → Show resolution UI → Re-save
  └─ NO  → Add to Sync Queue → Store in IndexedDB → Show "Queued" status
          
When Back Online:
  → Process Sync Queue (FIFO)
  → For each item: Send to Supabase
  → If conflict → Pause, show resolution UI
  → On resolution → Continue queue
  → Mark as synced
```

---

## Technology Choices

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Local DB** | IndexedDB + Dexie.js | Async, large capacity, good API |
| **Sync Engine** | Custom + axios | Fine-grained control, error handling |
| **State** | React Context + useReducer | No extra dependencies, TypeScript support |
| **Conflict** | Operational Transform (simple) | Easy to understand, sufficient for simple edits |

### Libraries to Add
```json
{
  "dexie": "^4.0.0",
  "uuid": "^9.0.0",
  "axios": "^1.6.0"
}
```

---

## Key Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Which data to sync?** | Sync only used tables; implement lazy loading |
| **Storage quota exceeded?** | Implement data retention (keep last 90 days) |
| **Bandwidth limited?** | Compress data, pagination, smart delta sync |
| **Offline too long?** | Server-side versioning, 3-way merge, conflict UI |
| **User makes 100+ edits?** | Queue batching, debounce, chunked uploads |
| **Same entry edited by 2 users?** | Operational Transform or CRDT-lite approach |

---

## File Structure (After Implementation)

```
src/
├── lib/
│   ├── supabase.ts (EXISTING)
│   ├── indexedDb.ts (NEW) - IndexedDB operations
│   ├── offlineSync.ts (NEW) - Sync orchestration
│   ├── syncQueue.ts (NEW) - Queue management
│   └── conflictResolver.ts (NEW) - Conflict logic
├── contexts/
│   ├── NetworkContext.tsx (NEW) - Online/offline state
│   └── SyncContext.tsx (NEW) - Sync state & operations
├── components/
│   ├── DiaryEntry.tsx (MODIFIED) - Use offline data
│   ├── Messages.tsx (MODIFIED) - Use offline data
│   ├── ConflictResolver.tsx (NEW) - Conflict UI
│   └── SyncStatusBar.tsx (NEW) - Sync indicator
├── hooks/
│   ├── useOfflineData.ts (NEW) - Read offline data
│   ├── useSync.ts (NEW) - Trigger sync
│   └── useNetworkStatus.ts (NEW) - Network state
```

---

## Implementation Complexity Levels

### 🟢 Simple (Essential - Do First)
- Local caching with IndexedDB
- Basic sync queue (store ops, replay when online)
- Online/offline status indicator
- Simple "last-write-wins" conflicts

### 🟡 Medium (Good to Have - Do Second)
- Smart sync (delta/partial sync)
- Retry mechanism with backoff
- Conflict UI for user resolution
- Sync progress indicator

### 🔴 Hard (Nice to Have - Do Later)
- Operational Transform (real-time collab)
- CRDT implementation (better conflict resolution)
- End-to-end encryption
- P2P sync (peer-to-peer between parent & teacher)

---

## Success Metrics

- ✅ App loads & works with no internet
- ✅ Changes saved offline persist in IndexedDB
- ✅ All queued changes sync when online
- ✅ No data loss on conflicts (user chooses resolution)
- ✅ Sync completes within 5 seconds for <100 changes
- ✅ UI shows sync progress & status
- ✅ Teacher & parent can work simultaneously without data loss

---

## Estimated Timeline
- **Phase 1**: 2-3 days (Foundation)
- **Phase 2**: 3-4 days (Sync Core)
- **Phase 3**: 2-3 days (UI)
- **Phase 4**: 2-3 days (Polish)
- **Total**: ~2 weeks for full offline-first with good conflict handling

---

## Questions to Consider

1. **Who are the primary offline users?** (Teachers, parents, or both?)
2. **What's the typical conflict frequency?** (Rare vs common?)
3. **Should we support offline teacher & parent simultaneously?** (Multi-device sync?)
4. **Data retention policy?** (Keep all history or prune?)
5. **Should parents sign digitally offline?** (Signature library needed?)
6. **Need real-time collab or batch updates?** (Affects approach)

---

## Next Steps
1. Approve this architecture
2. Choose complexity level to implement
3. Create implementation tickets in the roadmap
4. Set up development environment with test database
5. Begin Phase 1 implementation
