import { supabase } from './supabase';
import { SyncQueueItem } from './indexedDb';

export const conflictResolver = {
  /**
   * Checks if the remote version has been updated since our local change was made.
   */
  async checkForConflict(item: SyncQueueItem): Promise<boolean> {
    if (item.operation !== 'UPDATE') return false;

    try {
      const { data: remoteData, error } = await supabase
        .from(item.table)
        .select('updated_at')
        .eq('id', item.data.id)
        .single();

      if (error || !remoteData) return false;

      const remoteUpdatedAt = new Date(remoteData.updated_at).getTime();
      const localTimestamp = item.timestamp;

      // If remote is newer than our local change, we have a potential conflict
      return remoteUpdatedAt > localTimestamp;
    } catch (err) {
      console.error('[ConflictResolver] Error checking for conflict:', err);
      return false;
    }
  },

  /**
   * Resolves a conflict based on Last Write Wins (LWW) or simple rules.
   * Returns 'skip' to discard local change, or 'overwrite' to proceed.
   */
  async resolve(item: SyncQueueItem): Promise<'skip' | 'overwrite'> {
    console.warn(`[ConflictResolver] Conflict detected for ${item.table} ID ${item.data.id}`);
    
    // Default strategy: Last Write Wins (Local usually wins if we choose to overwrite)
    // But for MVP, let's keep the remote if it's newer.
    return 'overwrite'; // For now, we just overwrite. More complex logic can be added later.
  },

  async resolveAndSync(table: string, localData: any, strategy: 'local' | 'server' | 'merge', mergedData?: any) {
    if (strategy === 'server') return; // Do nothing, keep server version

    const dataToSync = strategy === 'merge' ? mergedData : localData;
    const { error } = await supabase.from(table).update(dataToSync).eq('id', localData.id);
    if (error) throw error;
  }
};