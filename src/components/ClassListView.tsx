import { useState, useEffect } from 'react';
import { supabase, ChildProfile } from '../lib/supabase';
import { Users, ArrowLeft } from 'lucide-react';

interface ClassListViewProps {
  onSelectStudent: (student: ChildProfile) => void;
  onBack: () => void;
}

export function ClassListView({ onSelectStudent, onBack }: ClassListViewProps) {
  const [students, setStudents] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('child_profile')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl border-2 border-amber-200 overflow-hidden">
          <div className="bg-amber-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Users className="w-8 h-8" />
                Class List
              </h1>
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </div>
            <p className="text-amber-100 mt-2">Select a student to view diary</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No students found</p>
                <p className="text-sm">Add students in Profile Setup</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    className="w-full p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.grade} • {student.school}</p>
                    </div>
                    <span className="text-amber-600">View Diary →</span>
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
