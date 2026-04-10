import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface NetworkState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
}

interface NetworkContextType extends NetworkState {
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: number) => void;
  setPendingChanges: (count: number) => void;
  triggerSync: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
  onSyncTrigger?: () => void;
}

export function NetworkProvider({ children, onSyncTrigger }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = useCallback(() => {
    if (onSyncTrigger) {
      onSyncTrigger();
    }
  }, [onSyncTrigger]);

  const value: NetworkContextType = {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    setSyncing: setIsSyncing,
    setLastSyncTime,
    setPendingChanges,
    triggerSync
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

export { NetworkContext };