import { useNetwork } from '../contexts/NetworkContext';
import { useSync } from '../contexts/SyncContext';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export function SyncStatusBar() {
  const { isOnline } = useNetwork();
  const { isSyncing, pendingCount, lastSyncTime, error } = useSync();

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
      isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
    }`}>
      {isOnline ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      
      <span className="font-medium">
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {pendingCount > 0 && (
        <span className="px-2 py-0.5 text-xs bg-amber-100 rounded-full">
          {pendingCount} pending
        </span>
      )}

      {isSyncing && (
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
      )}

      {error && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">Sync error</span>
        </div>
      )}

      <span className="text-xs text-gray-500 ml-auto">
        Last sync: {formatTime(lastSyncTime)}
      </span>
    </div>
  );
}