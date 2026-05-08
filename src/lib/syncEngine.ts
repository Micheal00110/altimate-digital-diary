import { syncQueue } from './syncQueue';
import { supabase } from './supabase';
import { conflictResolver } from './conflictResolver';

export const syncEngine = {
  isSyncing: false,

  async processQueue() {
    if (this.isSyncing) return { success: false };
    if (!navigator.onLine) return { success: false };

    const pendingItems = await syncQueue.getPendingItems();
    if (pendingItems.length === 0) return { success: true };

    this.isSyncing = true;
    console.log(`[SyncEngine] Processing ${pendingItems.length} items...`);

    for (const item of pendingItems) {
      try {
        await syncQueue.markAsSyncing(item.id);
        
        let error = null;
        
        switch (item.operation) {
          case 'CREATE':
            ({ error } = await supabase.from(item.table).insert([item.data]));
            break;
          case 'UPDATE':
            // Check for conflicts before updating
            const isConflict = await conflictResolver.checkForConflict(item);
            if (isConflict) {
              const resolution = await conflictResolver.resolve(item);
              if (resolution === 'skip') {
                 await syncQueue.markAsSynced(item.id);
                 continue;
              }
              // If we decide to overwrite, we continue with the original update data or resolved data
            }
            ({ error } = await supabase.from(item.table).update(item.data).eq('id', item.data.id));
            break;
          case 'DELETE':
            ({ error } = await supabase.from(item.table).delete().eq('id', item.data.id));
            break;
        }

        if (error) {
          console.error(`[SyncEngine] Error syncing item ${item.id}:`, error);
          await syncQueue.markAsFailed(item.id, error.message);
        } else {
          await syncQueue.markAsSynced(item.id);
          console.log(`[SyncEngine] Successfully synced item ${item.id}`);
        }
      } catch (err) {
        console.error(`[SyncEngine] Unexpected error syncing item ${item.id}:`, err);
        await syncQueue.markAsFailed(item.id, err instanceof Error ? err.message : 'Unknown error');
      }
    }

    this.isSyncing = false;
    console.log('[SyncEngine] Processing complete.');
    return { success: true };
  },

  async startAutoSync(intervalMs = 30000) {
    // Initial sync
    await this.processQueue();

    // Set up periodic sync
    setInterval(() => {
      this.processQueue();
    }, intervalMs);

    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('[SyncEngine] Back online, triggering sync...');
      this.processQueue();
    });
  }
};