import { useState, useEffect } from 'react';
import { supabase, DiaryEntry } from '../lib/supabase';
import { ArrowLeft, CheckCircle, Circle, Calendar } from 'lucide-react';

interface DiaryHistoryProps {
  onBack: () => void;
  onSelectDate: (date: string) => void;
}

export function DiaryHistory({ onBack, onSelectDate }: DiaryHistoryProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEntryClick = (date: string) => {
    onSelectDate(date);
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-gray-600">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl border-2 border-amber-200 overflow-hidden">
          <div className="bg-amber-600 text-white p-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 mb-4 hover:text-amber-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Today
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Diary History
            </h1>
            <p className="text-amber-100 mt-2">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded
            </p>
          </div>

          <div className="p-6 bg-gradient-to-b from-yellow-50 to-white">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No entries yet</p>
                <p className="text-gray-400 mt-2">Start by adding today's entry</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleEntryClick(entry.date)}
                    className="w-full text-left bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-amber-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-gray-800 text-lg">
                            {formatDate(entry.date)}
                          </p>
                          {entry.signed ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                          )}
                        </div>

                        {entry.subject && (
                          <p className="text-amber-700 font-medium mb-1">
                            {entry.subject}
                          </p>
                        )}

                        {entry.homework && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {entry.homework}
                          </p>
                        )}

                        {entry.teacher_comment && (
                          <p className="text-gray-500 text-sm italic mt-1 line-clamp-1">
                            "{entry.teacher_comment}"
                          </p>
                        )}

                        {!entry.subject && !entry.homework && !entry.teacher_comment && (
                          <p className="text-gray-400 text-sm italic">No details recorded</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
