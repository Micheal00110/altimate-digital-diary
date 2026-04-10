import { supabase } from './supabase';
import { indexedDb } from './indexedDb';

export interface ConflictField {
  field: string;
  localValue: unknown;
  serverValue: unknown;
}

export interface ConflictData {
  id: string;
  table: string;
  localVersion: Record<string, unknown>;
  serverVersion: Record<string, unknown>;
  localTimestamp: number;
  serverTimestamp: number;
}

export interface ResolutionResult {
  success: boolean;
  mergedData?: Record<string, unknown>;
  error?: string;
}

export const conflictResolver = {
  async detectConflict<T extends { id: string; updated_at?: string }>(
    _table: string,
    localData: T,
    serverData: T
  ): Promise<ConflictField[]> {
    const conflicts: ConflictField[] = [];
    const ignoredFields = ['id', 'created_at', 'sync_status'];

    for (const key of Object.keys(localData)) {
      if (ignoredFields.includes(key)) continue;

      const localValue = localData[key as keyof T];
      const serverValue = serverData[key as keyof T];

      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflicts.push({
          field: key,
          localValue,
          serverValue
        });
      }
    }

    return conflicts;
  },

  async fetchServerVersion(table: string, id: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Record<string, unknown>;
  },

  async checkForConflict(
    table: string,
    localRecord: Record<string, unknown>
  ): Promise<{ hasConflict: boolean; serverData?: Record<string, unknown> }> {
    const id = localRecord.id as string;
    if (!id) return { hasConflict: false };

    const serverData = await this.fetchServerVersion(table, id);
    if (!serverData) return { hasConflict: false };

    const localTimestamp = (localRecord.updated_at as string) || '';
    const serverTimestamp = (serverData.updated_at as string) || '';

    if (localTimestamp && serverTimestamp && localTimestamp !== serverTimestamp) {
      const localTime = new Date(localTimestamp).getTime();
      const serverTime = new Date(serverTimestamp).getTime();

      if (Math.abs(localTime - serverTime) > 1000) {
        return { hasConflict: true, serverData };
      }
    }

    return { hasConflict: false };
  },

  resolveWithLocal(localData: Record<string, unknown>): ResolutionResult {
    return { success: true, mergedData: localData };
  },

  resolveWithServer(serverData: Record<string, unknown>): ResolutionResult {
    return { success: true, mergedData: serverData };
  },

  mergeData(
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>,
    userSelections: Record<string, 'local' | 'server'>
  ): ResolutionResult {
    const merged = { ...serverData };

    for (const [field, choice] of Object.entries(userSelections)) {
      if (choice === 'local') {
        merged[field] = localData[field];
      }
    }

    return { success: true, mergedData: merged };
  },

  async resolveAndSync(
    table: string,
    localData: Record<string, unknown>,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: Record<string, unknown>
  ): Promise<ResolutionResult> {
    try {
      let dataToSave: Record<string, unknown>;

      if (resolution === 'local') {
        dataToSave = localData;
      } else if (resolution === 'server') {
        const serverData = await this.fetchServerVersion(table, localData.id as string);
        if (!serverData) {
          return { success: false, error: 'Server record not found' };
        }
        dataToSave = serverData;
      } else if (resolution === 'merge' && mergedData) {
        dataToSave = mergedData;
      } else {
        return { success: false, error: 'Invalid resolution' };
      }

      dataToSave.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from(table)
        .update(dataToSave)
        .eq('id', dataToSave.id);

      if (error) throw error;

      const localRecord = await indexedDb.getDiaryEntry(dataToSave.id as string);
      if (localRecord) {
        await indexedDb.saveDiaryEntry({ ...localRecord, ...dataToSave, sync_status: 'synced' });
      }

      return { success: true, mergedData: dataToSave };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resolution failed'
      };
    }
  },

  getFieldDisplayName(field: string): string {
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
  },

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
};