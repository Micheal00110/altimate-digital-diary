import { supabase } from './supabase';
import { indexedDb, ChildProfile, DiaryEntry, Message, Announcement, SyncQueueItem } from './indexedDb';
import { syncQueue } from './syncQueue';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  error?: string;
}

export const offlineSync = {
  async downloadAllData(childId?: string): Promise<SyncResult> {
    try {
      const profiles = await this.downloadProfiles();
      await indexedDb.saveChildProfile(profiles[0]);
      
      const entries = await this.downloadDiaryEntries(childId);
      await indexedDb.saveDiaryEntries(entries);
      
      const messages = await this.downloadMessages(childId);
      await indexedDb.saveMessages(messages);
      
      const announcements = await this.downloadAnnouncements();
      await indexedDb.saveAnnouncements(announcements);
      
      return { success: true, syncedCount: profiles.length + entries.length + messages.length + announcements.length };
    } catch (error) {
      return { success: false, syncedCount: 0, error: error instanceof Error ? error.message : 'Download failed' };
    }
  },

  async downloadProfiles(): Promise<ChildProfile[]> {
    const { data, error } = await supabase.from('child_profiles').select('*');
    if (error) throw error;
    return data as ChildProfile[];
  },

  async downloadDiaryEntries(childId?: string): Promise<DiaryEntry[]> {
    let query = supabase.from('diary_entries').select('*');
    if (childId) {
      query = query.eq('child_id', childId);
    }
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return (data as DiaryEntry[]).map(entry => ({ ...entry, sync_status: 'synced' }));
  },

  async downloadMessages(childId?: string): Promise<Message[]> {
    let query = supabase.from('messages').select('*');
    if (childId) {
      query = query.eq('child_id', childId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Message[]).map(msg => ({ ...msg, sync_status: 'synced' }));
  },

  async downloadAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Announcement[]).map(a => ({ ...a, sync_status: 'synced' }));
  },

  async saveOfflineDiaryEntry(entry: Omit<DiaryEntry, 'sync_status'>, isOnline: boolean): Promise<void> {
    const entryWithStatus: DiaryEntry = { ...entry, sync_status: isOnline ? 'synced' : 'pending' };
    await indexedDb.saveDiaryEntry(entryWithStatus);
    
    if (!isOnline) {
      await syncQueue.addItem({
        table: 'diary_entries',
        operation: 'CREATE',
        data: entry
      });
    }
  },

  async saveOfflineMessage(message: Omit<Message, 'sync_status'>, isOnline: boolean): Promise<void> {
    const messageWithStatus: Message = { ...message, sync_status: isOnline ? 'synced' : 'pending' };
    await indexedDb.saveMessage(messageWithStatus);
    
    if (!isOnline) {
      await syncQueue.addItem({
        table: 'messages',
        operation: 'CREATE',
        data: message
      });
    }
  },

  async saveOfflineAnnouncement(announcement: Omit<Announcement, 'sync_status'>, isOnline: boolean): Promise<void> {
    const announcementWithStatus: Announcement = { ...announcement, sync_status: isOnline ? 'synced' : 'pending' };
    await indexedDb.saveAnnouncement(announcementWithStatus);
    
    if (!isOnline) {
      await syncQueue.addItem({
        table: 'announcements',
        operation: 'CREATE',
        data: announcement
      });
    }
  },

  async getOfflineDiaryEntries(childId: string): Promise<DiaryEntry[]> {
    return indexedDb.getDiaryEntriesByChild(childId);
  },

  async getOfflineMessages(childId: string): Promise<Message[]> {
    return indexedDb.getMessagesByChild(childId);
  },

  async getOfflineAnnouncements(): Promise<Announcement[]> {
    return indexedDb.getAllAnnouncements();
  },

  async getOfflineChildProfile(id: string): Promise<ChildProfile | undefined> {
    return indexedDb.getChildProfile(id);
  },

  async syncPendingChanges(): Promise<SyncResult> {
    const pendingItems = await syncQueue.getPendingItems();
    let syncedCount = 0;

    for (const item of pendingItems) {
      try {
        await syncQueue.markAsSyncing(item.id);
        
        await this.processPendingItem(item);
        await syncQueue.markAsSynced(item.id);
        syncedCount++;
      } catch (error) {
        await syncQueue.markAsFailed(item.id, error instanceof Error ? error.message : 'Sync failed');
      }
    }

    await syncQueue.clearSynced();
    return { success: true, syncedCount };
  },

  async processPendingItem(item: SyncQueueItem): Promise<void> {
    const { table, operation, data } = item;
    
    switch (table) {
      case 'diary_entries':
        if (operation === 'CREATE') {
          const { error } = await supabase.from('diary_entries').insert(data).select().single();
          if (error) throw error;
        } else if (operation === 'UPDATE') {
          const { error } = await supabase.from('diary_entries').update(data).eq('id', data.id);
          if (error) throw error;
        } else if (operation === 'DELETE') {
          const { error } = await supabase.from('diary_entries').delete().eq('id', data.id);
          if (error) throw error;
        }
        break;
        
      case 'messages':
        if (operation === 'CREATE') {
          const { error } = await supabase.from('messages').insert(data);
          if (error) throw error;
        } else if (operation === 'UPDATE') {
          const { error } = await supabase.from('messages').update(data).eq('id', data.id);
          if (error) throw error;
        }
        break;
        
      case 'announcements':
        if (operation === 'CREATE') {
          const { error } = await supabase.from('announcements').insert(data);
          if (error) throw error;
        }
        break;
        
      default:
        console.warn(`Unknown table: ${table}`);
    }
  }
};