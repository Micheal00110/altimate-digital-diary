import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { syncQueue } from '../lib/syncQueue';
import { syncEngine } from '../lib/syncEngine';
import { useNetwork } from './NetworkContext';

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
  const { isOnline, setSyncing, setLastSyncTime: setNetworkLastSync, setPendingChanges } = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updatePendingCount = useCallback(async () => {
    const count = await syncQueue.getPendingCount();
    setPendingCount(count);
    setPendingChanges(count);
  }, [setPendingChanges]);

  useEffect(() => {
    updatePendingCount();
    // Refresh count periodically
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    setSyncing(true);
    setError(null);

    try {
      await syncEngine.processQueue();
      
      setLastSyncTime(Date.now());
      setNetworkLastSync(Date.now());
      await updatePendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
      setSyncing(false);
    }
  }, [isOnline, isSyncing, setSyncing, setNetworkLastSync, updatePendingCount]);

  const resolveConflict = useCallback(async (conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    await updatePendingCount();
  }, [updatePendingCount]);

  const clearError = useCallback(() => setError(null), []);

  // Auto-sync when online and has pending items
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncNow();
      }, 2000); // Small delay to batch changes
      return () => clearTimeout(timer);
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