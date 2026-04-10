import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { syncQueue } from '../lib/syncQueue';
import { useNetwork } from './NetworkContext';
import type { SyncQueueItem } from '../lib/indexedDb';

export interface SyncConflict {
  id: string;
  table: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  timestamp: number;
}

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  conflicts: SyncConflict[];
  lastSyncTime: number | null;
  error: string | null;
}

interface SyncContextType extends SyncState {
  syncNow: () => Promise<void>;
  resolveConflict: (conflictId: string) => Promise<void>;
  clearError: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { isOnline } = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updatePendingCount = useCallback(async () => {
    const count = await syncQueue.getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    setError(null);

    try {
      const pendingItems = await syncQueue.getPendingItems();
      
      for (const item of pendingItems) {
        await syncQueue.markAsSyncing(item.id);
        
        try {
          await processSyncItem(item);
          await syncQueue.markAsSynced(item.id);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Sync failed';
          await syncQueue.markAsFailed(item.id, errorMessage);
        }
      }
      
      await syncQueue.clearSynced();
      setLastSyncTime(Date.now());
      await updatePendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  const processSyncItem = async (item: SyncQueueItem): Promise<void> => {
    const data = item.data;
    const operation = item.operation;
    
    if (operation === 'DELETE') {
      console.log(`Deleting ${item.table}:`, data.id);
    } else if (operation === 'CREATE') {
      console.log(`Creating ${item.table}:`, data);
    } else if (operation === 'UPDATE') {
      console.log(`Updating ${item.table}:`, data);
    }
  };

  const resolveConflict = useCallback(async (conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    await updatePendingCount();
  }, [updatePendingCount]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncNow();
    }
  }, [isOnline, pendingCount, isSyncing, syncNow]);

  const value: SyncContextType = {
    isSyncing,
    pendingCount,
    conflicts,
    lastSyncTime,
    error,
    syncNow,
    resolveConflict,
    clearError
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

export { SyncContext };