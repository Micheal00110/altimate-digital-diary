import Dexie, { Table } from 'dexie';

export interface ChildProfile {
  id: string;
  name: string;
  birth_date: string;
  parent_id: string;
  teacher_id?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DiaryEntry {
  id: string;
  child_id: string;
  date: string;
  morning_comment?: string;
  afternoon_comment?: string;
  activities?: string;
  meals?: string;
  naps?: string;
  mood?: string;
  teacher_id: string;
  parent_signature?: string;
  created_at: string;
  updated_at: string;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface Message {
  id: string;
  child_id: string;
  sender_id: string;
  sender_type: 'teacher' | 'parent';
  content: string;
  is_read: boolean;
  created_at: string;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  teacher_id: string;
  created_at: string;
  sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: number;
  attempt: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

class ChildEdiaryDB extends Dexie {
  child_profiles!: Table<ChildProfile>;
  diary_entries!: Table<DiaryEntry>;
  messages!: Table<Message>;
  announcements!: Table<Announcement>;
  sync_queue!: Table<SyncQueueItem>;

  constructor() {
    super('child-ediary-offline');
    this.version(2).stores({
      child_profiles: 'id',
      diary_entries: 'id, child_id, date, sync_status',
      messages: 'id, child_id, is_read, sender_type, sync_status',
      announcements: 'id, created_at, sync_status',
      sync_queue: 'id, table, status, timestamp'
    });
  }
}

export const db = new ChildEdiaryDB();

// Helper to safely execute IndexedDB operations
async function safeDbOp<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    console.error('[IndexedDB Error] Fallback triggered:', err);
    return fallback;
  }
}

export const indexedDb = {
  async getChildProfile(id: string): Promise<ChildProfile | undefined> {
    return safeDbOp(() => db.child_profiles.get(id), undefined);
  },

  async getAllChildProfiles(): Promise<ChildProfile[]> {
    return db.child_profiles.toArray();
  },

  async saveChildProfile(profile: ChildProfile): Promise<string> {
    return db.child_profiles.put(profile);
  },

  async getDiaryEntry(id: string): Promise<DiaryEntry | undefined> {
    return db.diary_entries.get(id);
  },

  async getDiaryEntriesByChild(childId: string): Promise<DiaryEntry[]> {
    return db.diary_entries.where('child_id').equals(childId).toArray();
  },

  async getDiaryEntriesByDate(childId: string, date: string): Promise<DiaryEntry[]> {
    return db.diary_entries.where(['child_id', 'date']).equals([childId, date]).toArray();
  },

  async saveDiaryEntry(entry: DiaryEntry): Promise<string> {
    return db.diary_entries.put(entry);
  },

  async saveDiaryEntries(entries: DiaryEntry[]): Promise<void> {
    await db.diary_entries.bulkPut(entries);
  },

  async getMessage(id: string): Promise<Message | undefined> {
    return db.messages.get(id);
  },

  async getMessagesByChild(childId: string): Promise<Message[]> {
    return db.messages.where('child_id').equals(childId).toArray();
  },

  async saveMessage(message: Message): Promise<string> {
    return db.messages.put(message);
  },

  async saveMessages(messages: Message[]): Promise<void> {
    await db.messages.bulkPut(messages);
  },

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return db.announcements.get(id);
  },

  async getAllAnnouncements(): Promise<Announcement[]> {
    return db.announcements.orderBy('created_at').reverse().toArray();
  },

  async saveAnnouncement(announcement: Announcement): Promise<string> {
    return db.announcements.put(announcement);
  },

  async saveAnnouncements(announcements: Announcement[]): Promise<void> {
    await db.announcements.bulkPut(announcements);
  },

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return db.sync_queue.where('status').equals('pending').toArray();
  },

  async addToSyncQueue(item: SyncQueueItem): Promise<string> {
    return db.sync_queue.put(item);
  },

  async updateSyncQueueItem(item: SyncQueueItem): Promise<string> {
    return db.sync_queue.put(item);
  },

  async getSyncQueueItems(): Promise<SyncQueueItem[]> {
    return db.sync_queue.toArray();
  },

  async clearSyncedItems(): Promise<void> {
    await db.sync_queue.where('status').equals('synced').delete();
  },

  async getPendingCount(): Promise<number> {
    return db.sync_queue.where('status').equals('pending').count();
  }
};