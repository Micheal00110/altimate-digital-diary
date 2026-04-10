import { useState, useEffect, useCallback } from 'react';
import { supabase, DiaryEntry as DiaryEntryType } from '../lib/supabase';
import { Check, Save, Calendar } from 'lucide-react';

interface DiaryEntryProps {
  selectedDate: string;
  onViewHistory: () => void;
}

export function DiaryEntry({ selectedDate, onViewHistory }: DiaryEntryProps) {
  const [entry, setEntry] = useState<DiaryEntryType | null>(null);
  const [subject, setSubject] = useState('');
  const [homework, setHomework] = useState('');
  const [teacherComment, setTeacherComment] = useState('');
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEntry = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('date', selectedDate)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setEntry(data);
        setSubject(data.subject);
        setHomework(data.homework);
        setTeacherComment(data.teacher_comment);
        setSigned(data.signed);
      } else {
        setEntry(null);
        setSubject('');
        setHomework('');
        setTeacherComment('');
        setSigned(false);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const saveEntry = async () => {
    setSaving(true);
    try {
      const entryData = {
        date: selectedDate,
        subject,
        homework,
        teacher_comment: teacherComment,
        signed,
      };

      if (entry) {
        const { error } = await supabase
          .from('diary_entries')
          .update(entryData)
          .eq('id', entry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('diary_entries')
          .insert([entryData]);

        if (error) throw error;
      }

      await loadEntry();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl border-2 border-amber-200 overflow-hidden">
          <div className="bg-amber-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">School Diary</h1>
              <button
                onClick={onViewHistory}
                className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 px-4 py-2 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5" />
                History
              </button>
            </div>
            <p className="text-amber-100 mt-2">{formatDate(selectedDate)}</p>
          </div>

          <div className="p-6 space-y-6 bg-gradient-to-b from-yellow-50 to-white">
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg bg-white"
                placeholder="e.g., Mathematics, English"
              />
            </div>

            <div>
              <label htmlFor="homework" className="block text-sm font-semibold text-gray-700 mb-2">
                Homework
              </label>
              <textarea
                id="homework"
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg bg-white resize-none"
                placeholder="Enter homework details..."
              />
            </div>

            <div>
              <label htmlFor="teacher-comment" className="block text-sm font-semibold text-gray-700 mb-2">
                Teacher Comment
              </label>
              <textarea
                id="teacher-comment"
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg bg-white resize-none"
                placeholder="Teacher's comments..."
              />
            </div>

            <div className="border-t-2 border-gray-200 pt-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={signed}
                    onChange={(e) => setSigned(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-8 h-8 border-2 rounded-md flex items-center justify-center transition-all ${
                      signed
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300 group-hover:border-green-400'
                    }`}
                  >
                    {signed && <Check className="w-5 h-5 text-white" />}
                  </div>
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  Work Ensured (Parent Signature)
                </span>
              </label>
            </div>

            <button
              onClick={saveEntry}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
