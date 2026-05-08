import { useState, FormEvent } from 'react';
import { supabase, ChildProfile } from '../lib/supabase';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ProfileSetupProps {
  onProfileCreated: () => void;
  onBypass?: (profile: ChildProfile) => void;
}

export function ProfileSetup({ onProfileCreated }: ProfileSetupProps) {
  const { user } = useAuth();
  const userRole = user?.role || 'parent';
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isTeacher = userRole === 'teacher';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[ProfileSetup] Creating profile as', userRole, ':', { name, grade, school });

      const profileTable = isTeacher ? 'teacher_profiles' : 'parent_profiles';
      const profileData = isTeacher
        ? { user_id: user?.id, name, class_grade: grade, school_name: school }
        : { user_id: user?.id, name, relationship_to_child: 'parent', phone_number: '' };

      const { data, error: supabaseError } = await supabase
        .from(profileTable)
        .upsert([profileData], { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      console.log('[ProfileSetup] Insert result:', { data, error: supabaseError });

      if (supabaseError) {
        console.error('[ProfileSetup] Supabase error:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      if (!data) {
        setError('Failed to create profile - please try again');
        return;
      }

      console.log('[ProfileSetup] Profile created successfully');

      if (onProfileCreated) {
        onProfileCreated();
      }

    } catch (err: unknown) {
      console.error('[ProfileSetup] Catch error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full border-2 border-amber-200">
        <div className="flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12 text-amber-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">MyChild Diary</h1>
        </div>

        <p className="text-gray-600 text-center mb-2">
          {isTeacher ? 'Set up your teacher profile' : 'Set up your child\'s profile'}
        </p>
        <p className="text-gray-400 text-center text-sm mb-6">
          Signed in as: {user?.email} ({userRole})
        </p>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              {isTeacher ? 'Your Name' : 'Child\'s Name'}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              placeholder={isTeacher ? 'Enter your name' : "Enter child's name"}
            />
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-semibold text-gray-700 mb-2">
              {isTeacher ? 'Class/Grade You Teach' : 'Grade/Class'}
            </label>
            <input
              type="text"
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              placeholder={isTeacher ? 'e.g., Grade 3' : 'e.g., Grade 5'}
            />
          </div>

          <div>
            <label htmlFor="school" className="block text-sm font-semibold text-gray-700 mb-2">
              School Name
            </label>
            <input
              type="text"
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              placeholder="Enter school name"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg shadow-md"
          >
            {loading ? 'Creating...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}