import { useState, useEffect, useCallback } from 'react';
import { supabase, Announcement } from '../lib/supabase';
import { Bell, ArrowLeft, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface AnnouncementsProps {
  onBack: () => void;
}

export function Announcements({ onBack }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          icon: 'text-red-500',
          badge: 'bg-red-500 text-white'
        };
      case 'important':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          icon: 'text-amber-500',
          badge: 'bg-amber-500 text-white'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          icon: 'text-blue-500',
          badge: 'bg-blue-500 text-white'
        };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5" />;
      case 'important':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl border-2 border-purple-200 overflow-hidden">
          <div className="bg-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={onBack} className="hover:bg-purple-700 p-2 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Bell className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Announcements</h1>
              </div>
            </div>
            <p className="text-purple-100 mt-2">Stay updated with school news</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No announcements yet</p>
              <p className="text-gray-400">Check back later for school updates</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {announcements.map((announcement) => {
                const styles = getPriorityStyles(announcement.priority);
                return (
                  <div
                    key={announcement.id}
                    className={`p-4 ${styles.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={styles.icon}>{getPriorityIcon(announcement.priority)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
                            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(announcement.created_at)}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg">{announcement.title}</h3>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{announcement.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}