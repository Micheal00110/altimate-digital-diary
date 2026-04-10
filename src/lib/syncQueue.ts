import { v4 as uuidv4 } from 'uuid';
import { indexedDb, SyncQueueItem } from './indexedDb';

export interface QueueItemInput {
  table: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 5000, 15000];

export const syncQueue = {
  async addItem(input: QueueItemInput): Promise<string> {
    const item: SyncQueueItem = {
      id: uuidv4(),
      table: input.table,
      operation: input.operation,
      data: input.data,
      timestamp: Date.now(),
      attempt: 0,
      status: 'pending'
    };
    return indexedDb.addToSyncQueue(item);
  },

  async getPendingItems(): Promise<SyncQueueItem[]> {
    return indexedDb.getPendingSyncItems();
  },

  async getAllItems(): Promise<SyncQueueItem[]> {
    return indexedDb.getSyncQueueItems();
  },

  async markAsSyncing(id: string): Promise<void> {
    const item = await indexedDb.getSyncQueueItems().then(items => items.find(i => i.id === id));
    if (item) {
      item.status = 'syncing';
      await indexedDb.updateSyncQueueItem(item);
    }
  },

  async markAsSynced(id: string): Promise<void> {
    const items = await indexedDb.getSyncQueueItems();
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = 'synced';
      await indexedDb.updateSyncQueueItem(item);
    }
  },

  async markAsFailed(id: string, error: string): Promise<void> {
    const items = await indexedDb.getSyncQueueItems();
    const item = items.find(i => i.id === id);
    if (item) {
      item.attempt += 1;
      item.error = error;
      if (item.attempt >= MAX_RETRY_ATTEMPTS) {
        item.status = 'failed';
      } else {
        item.status = 'pending';
      }
      await indexedDb.updateSyncQueueItem(item);
    }
  },

  async getRetryDelay(attempt: number): Promise<number> {
    return RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
  },

  async clearSynced(): Promise<void> {
    await indexedDb.clearSyncedItems();
  },

  async getPendingCount(): Promise<number> {
    return indexedDb.getPendingCount();
  },

  async removeItem(id: string): Promise<void> {
    const items = await indexedDb.getSyncQueueItems();
    const item = items.find(i => i.id === id);
    if (item) {
      await indexedDb.updateSyncQueueItem({ ...item, status: 'synced' });
    }
  }
};