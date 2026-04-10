import { useState } from 'react';
import { useSync, SyncConflict as ConflictType } from '../contexts/SyncContext';
import { conflictResolver } from '../lib/conflictResolver';
import { X } from 'lucide-react';

interface ConflictData {
  id: string;
  table: string;
  localVersion: Record<string, unknown>;
  serverVersion: Record<string, unknown>;
}

function getFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    morning_comment: 'Morning Comment',
    afternoon_comment: 'Afternoon Comment',
    activities: 'Activities',
    meals: 'Meals',
    naps: 'Naps',
    mood: 'Mood',
    content: 'Content',
    title: 'Title',
    name: 'Name',
    birth_date: 'Birth Date'
  };
  return displayNames[field] || field;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ConflictResolver() {
  const { conflicts, resolveConflict } = useSync();
  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(null);
  const [selections, setSelections] = useState<Record<string, 'local' | 'server'>>({});
  const [isResolving, setIsResolving] = useState(false);

  if (conflicts.length === 0) return null;

  const toConflictData = (c: ConflictType): ConflictData => ({
    id: c.id,
    table: c.table,
    localVersion: c.localData,
    serverVersion: c.remoteData
  });

  const handleSelectConflict = (conflict: ConflictType) => {
    setSelectedConflict(toConflictData(conflict));
    setSelections({});
  };

  const handleFieldChoice = (field: string, choice: 'local' | 'server') => {
    setSelections(prev => ({ ...prev, [field]: choice }));
  };

  const handleResolve = async () => {
    if (!selectedConflict) return;
    setIsResolving(true);

    try {
      const allFields = Object.keys(selectedConflict.localVersion).filter(
        k => k !== 'id' && k !== 'created_at'
      );
      const merged: Record<string, unknown> = {};

      for (const field of allFields) {
        const choice = selections[field] || 'server';
        merged[field] = choice === 'local' 
          ? selectedConflict.localVersion[field] 
          : selectedConflict.serverVersion[field];
      }

      await conflictResolver.resolveAndSync(
        selectedConflict.table,
        selectedConflict.localVersion,
        'merge',
        merged
      );

      await resolveConflict(selectedConflict.id);
      setSelectedConflict(null);
      setSelections({});
    } finally {
      setIsResolving(false);
    }
  };

  const handleKeepLocal = async (id: string) => {
    await conflictResolver.resolveAndSync(
      selectedConflict!.table,
      selectedConflict!.localVersion,
      'local'
    );
    await resolveConflict(id);
    setSelectedConflict(null);
  };

  const handleKeepServer = async (id: string) => {
    await conflictResolver.resolveAndSync(
      selectedConflict!.table,
      selectedConflict!.localVersion,
      'server'
    );
    await resolveConflict(id);
    setSelectedConflict(null);
  };

  if (!selectedConflict) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sync Conflicts</h2>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-sm rounded-lg">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {conflicts.map(conflict => (
              <button
                key={conflict.id}
                onClick={() => handleSelectConflict(conflict)}
                className="w-full p-3 text-left border rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors"
              >
                <div className="font-medium text-gray-900 capitalize">
                  {conflict.table.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {String(conflict.localData.id).slice(0, 8)}...
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const fields = Object.keys(selectedConflict.localVersion).filter(
    k => k !== 'id' && k !== 'created_at' && k !== 'sync_status'
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Resolve Conflict - {selectedConflict.table.replace('_', ' ')}
          </h2>
          <button
            onClick={() => setSelectedConflict(null)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {fields.map(field => {
            const localVal = selectedConflict.localVersion[field];
            const serverVal = selectedConflict.serverVersion[field];
            const hasDiff = JSON.stringify(localVal) !== JSON.stringify(serverVal);

            return (
              <div key={field} className={`border rounded-lg p-3 ${hasDiff ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                <div className="font-medium text-gray-900 mb-2">
                  {getFieldDisplayName(field)}
                </div>
                
                {hasDiff ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleFieldChoice(field, 'local')}
                      className={`p-2 text-left text-sm rounded border-2 transition-colors ${
                        selections[field] === 'local'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">Your version</div>
                      <div className="truncate">{formatValue(localVal)}</div>
                    </button>
                    
                    <button
                      onClick={() => handleFieldChoice(field, 'server')}
                      className={`p-2 text-left text-sm rounded border-2 transition-colors ${
                        selections[field] === 'server'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">Server version</div>
                      <div className="truncate">{formatValue(serverVal)}</div>
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {formatValue(localVal)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={() => handleKeepLocal(selectedConflict.id)}
            disabled={isResolving}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Keep My Version
          </button>
          <button
            onClick={() => handleKeepServer(selectedConflict.id)}
            disabled={isResolving}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Keep Server Version
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Apply Selection{isResolving ? '...' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}