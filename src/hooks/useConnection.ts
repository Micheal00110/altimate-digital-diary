import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { syncQueue } from '../lib/syncQueue';
import { syncEngine } from '../lib/syncEngine';

interface UseConnectionReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  autoSyncEnabled: boolean;
  syncNow: () => Promise<void>;
  toggleAutoSync: (enabled: boolean) => void;
  connectionQuality: 'good' | 'fair' | 'poor' | 'unknown';
}

const AUTO_SYNC_INTERVAL = 30000;
const CONNECTION_QUALITY_THRESHOLDS = {
  good: 100,
  fair: 500,
  poor: Infinity
};

export function useConnection(): UseConnectionReturn {
  const { isOnline, lastSyncTime, setSyncing, setLastSyncTime } = useNetwork();
  const [isSyncing, setIsSyncingLocal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor' | 'unknown'>('unknown');
  const syncIntervalRef = useRef<number | null>(null);
  const latencyHistoryRef = useRef<number[]>([]);

  const measureLatency = useCallback(async () => {
    if (!isOnline) return;
    
    const start = performance.now();
    try {
      await fetch('/api/health', { method: 'HEAD', mode: 'no-cors' });
      const latency = performance.now() - start;
      
      latencyHistoryRef.current.push(latency);
      if (latencyHistoryRef.current.length > 10) {
        latencyHistoryRef.current.shift();
      }

      const avgLatency = latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length;
      
      if (avgLatency < CONNECTION_QUALITY_THRESHOLDS.good) {
        setConnectionQuality('good');
      } else if (avgLatency < CONNECTION_QUALITY_THRESHOLDS.fair) {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('poor');
      }
    } catch {
      setConnectionQuality('poor');
    }
  }, [isOnline]);

  const updatePendingCount = useCallback(async () => {
    const count = await syncQueue.getPendingCount();
    setPendingCount(count);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncingLocal(true);
    setSyncing(true);

    try {
      const result = await syncEngine.processQueue();
      
      if (result.success) {
        setLastSyncTime(Date.now());
      }
      
      await updatePendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncingLocal(false);
      setSyncing(false);
    }
  }, [isOnline, isSyncing, setSyncing, setLastSyncTime, updatePendingCount]);

  const toggleAutoSync = useCallback((enabled: boolean) => {
    setAutoSyncEnabled(enabled);
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  useEffect(() => {
    if (!isOnline || !autoSyncEnabled) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    syncIntervalRef.current = window.setInterval(() => {
      if (pendingCount > 0 && !isSyncing) {
        syncNow();
      }
      measureLatency();
    }, AUTO_SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, autoSyncEnabled, pendingCount, isSyncing, syncNow, measureLatency]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && autoSyncEnabled && !isSyncing) {
      const debounceTimeout = setTimeout(syncNow, 2000);
      return () => clearTimeout(debounceTimeout);
    }
  }, [isOnline, pendingCount, autoSyncEnabled, isSyncing, syncNow]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    autoSyncEnabled,
    syncNow,
    toggleAutoSync,
    connectionQuality
  };
}