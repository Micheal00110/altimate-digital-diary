import { supabase } from './supabase';
import { indexedDb, SyncQueueItem } from './indexedDb';
import { syncQueue } from './syncQueue';

interface SyncEngineConfig {
  maxRetries?: number;
  retryDelays?: number[];
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
  onConflict?: (conflict: SyncConflict) => void;
}

export interface SyncConflict {
  id: string;
  table: string;
  operation: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  timestamp: number;
}

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  conflicts: SyncConflict[];
  errors: string[];
}

class SyncEngine {
  private config: Required<SyncEngineConfig>;
  private isProcessing = false;

  constructor(config: SyncEngineConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelays: config.retryDelays ?? [1000, 5000, 15000],
      batchSize: config.batchSize ?? 10,
      onProgress: config.onProgress ?? (() => {}),
      onConflict: config.onConflict ?? (() => {})
    };
  }

  async processQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      return { success: false, processed: 0, failed: 0, conflicts: [], errors: ['Sync already in progress'] };
    }

    this.isProcessing = true;
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      conflicts: [],
      errors: []
    };

    try {
      const pendingItems = await this.getPendingItems();
      const total = pendingItems.length;

      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        this.config.onProgress(i + 1, total);

        try {
          await this.processItem(item);
          await syncQueue.markAsSynced(item.id);
          result.processed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (errorMessage.includes('conflict') || errorMessage.includes('409')) {
            const conflict = await this.detectConflict(item);
            if (conflict) {
              result.conflicts.push(conflict);
              this.config.onConflict(conflict);
              continue;
            }
          }

          await syncQueue.markAsFailed(item.id, errorMessage);
          result.failed++;
          result.errors.push(`Failed to sync ${item.table}: ${errorMessage}`);
        }
      }

      await syncQueue.clearSynced();
    } finally {
      this.isProcessing = false;
    }

    result.success = result.failed === 0;
    return result;
  }

  private async getPendingItems(): Promise<SyncQueueItem[]> {
    return indexedDb.getPendingSyncItems();
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    const { table, operation, data } = item;

    switch (table) {
      case 'diary_entries':
        await this.processDiaryEntry(operation, data);
        break;
      case 'messages':
        await this.processMessage(operation, data);
        break;
      case 'announcements':
        await this.processAnnouncement(operation, data);
        break;
      case 'child_profiles':
      case 'child_profile':
        await this.processChildProfile(operation, data, table);
        break;
      default:
        console.warn(`Unknown table: ${table}`);
    }
  }

  private async processDiaryEntry(operation: string, data: Record<string, unknown>): Promise<void> {
    if (operation === 'CREATE') {
      const { error } = await supabase.from('diary_entries').insert(data).select().single();
      if (error) {
        if (error.code === '409') throw new Error('conflict');
        throw error;
      }
    } else if (operation === 'UPDATE') {
      const { error } = await supabase.from('diary_entries').update(data).eq('id', data.id);
      if (error) {
        if (error.code === '409') throw new Error('conflict');
        throw error;
      }
    } else if (operation === 'DELETE') {
      const { error } = await supabase.from('diary_entries').delete().eq('id', data.id);
      if (error) throw error;
    }
  }

  private async processMessage(operation: string, data: Record<string, unknown>): Promise<void> {
    if (operation === 'CREATE') {
      const { error } = await supabase.from('messages').insert(data);
      if (error) {
        if (error.code === '409') throw new Error('conflict');
        throw error;
      }
    } else if (operation === 'UPDATE') {
      const { error } = await supabase.from('messages').update(data).eq('id', data.id);
      if (error) {
        if (error.code === '409') throw new Error('conflict');
        throw error;
      }
    } else if (operation === 'DELETE') {
      const { error } = await supabase.from('messages').delete().eq('id', data.id);
      if (error) throw error;
    }
  }

  private async processAnnouncement(operation: string, data: Record<string, unknown>): Promise<void> {
    if (operation === 'CREATE') {
      const { error } = await supabase.from('announcements').insert(data);
      if (error) throw error;
    } else if (operation === 'UPDATE') {
      const { error } = await supabase.from('announcements').update(data).eq('id', data.id);
      if (error) throw error;
    } else if (operation === 'DELETE') {
      const { error } = await supabase.from('announcements').delete().eq('id', data.id);
      if (error) throw error;
    }
  }

  private async processChildProfile(operation: string, data: Record<string, unknown>, table: string): Promise<void> {
    if (operation === 'UPDATE') {
      const { error } = await supabase.from(table).update(data).eq('id', data.id);
      if (error) throw error;
    }
  }

  private async detectConflict(item: SyncQueueItem): Promise<SyncConflict | null> {
    try {
      const { table, data, operation } = item;
      const id = data.id as string;

      let serverData: Record<string, unknown> | null = null;

      if (operation === 'UPDATE' || operation === 'DELETE') {
        const { data: fetched, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (!error && fetched) {
          serverData = fetched;
        }
      }

      if (serverData) {
        return {
          id: item.id,
          table: item.table,
          operation: item.operation,
          localData: data,
          serverData,
          timestamp: Date.now()
        };
      }
    } catch (e) {
      console.error('Error detecting conflict:', e);
    }

    return null;
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'server'): Promise<void> {
    const items = await indexedDb.getSyncQueueItems();
    const item = items.find(i => i.id === conflictId);
    
    if (!item) return;

    if (resolution === 'server') {
      await syncQueue.markAsSynced(conflictId);
    } else {
      await syncQueue.markAsSynced(conflictId);
      await this.processItem({ ...item, operation: 'UPDATE' });
    }
  }

  isRunning(): boolean {
    return this.isProcessing;
  }
}

export const syncEngine = new SyncEngine();

export { SyncEngine };