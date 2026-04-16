import { useState, useEffect, useCallback } from 'react';
import { indexedDb, DiaryEntry, Message, Announcement, ChildProfile } from '../lib/indexedDb';

interface UseOfflineDataOptions {
  table: 'diary_entries' | 'messages' | 'announcements' | 'child_profiles';
  childId?: string;
}

interface UseOfflineDataReturn<T> {
  data: T[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOfflineData<T extends { id: string | number }>(options: UseOfflineDataOptions): UseOfflineDataReturn<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result: unknown;

      switch (options.table) {
        case 'diary_entries':
          if (options.childId) {
            result = await indexedDb.getDiaryEntriesByChild(options.childId);
          } else {
            result = await indexedDb.getDiaryEntriesByChild('');
          }
          break;
        case 'messages':
          if (options.childId) {
            result = await indexedDb.getMessagesByChild(options.childId);
          } else {
            result = [];
          }
          break;
        case 'announcements':
          result = await indexedDb.getAllAnnouncements();
          break;
        case 'child_profiles':
          if (options.childId) {
            result = await indexedDb.getChildProfile(options.childId);
            result = result ? [result] : [];
          } else {
            result = await indexedDb.getAllChildProfiles();
          }
          break;
      }

      setData(result as T[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [options.table, options.childId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useOfflineDiaryEntries(childId: string) {
  return useOfflineData<DiaryEntry>({ table: 'diary_entries', childId });
}

export function useOfflineMessages(childId: string) {
  return useOfflineData<Message>({ table: 'messages', childId });
}

export function useOfflineAnnouncements() {
  return useOfflineData<Announcement>({ table: 'announcements' });
}

export function useOfflineChildProfile(childId: string) {
  const { data } = useOfflineData<ChildProfile>({ table: 'child_profiles', childId });
  return data?.[0] || null;
}