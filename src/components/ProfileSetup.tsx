import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen } from 'lucide-react';

interface ProfileSetupProps {
  onProfileCreated: () => void;
}

export function ProfileSetup({ onProfileCreated }: ProfileSetupProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('[ProfileSetup] Creating profile:', { name, grade, school });

    try {
      const { data, error: supabaseError } = await supabase
        .from('child_profile')
        .insert([{ name, grade, school }])
        .select();

      console.log('[ProfileSetup] Response:', { data, error: supabaseError });

      if (supabaseError) {
        console.error('[ProfileSetup] Supabase error:', supabaseError);
        if (supabaseError.message.includes('relation') && supabaseError.message.includes('does not exist')) {
          setError('Database not set up. Please run the SQL migration in Supabase dashboard.');
        } else {
          setError(supabaseError.message);
        }
        return;
      }

      onProfileCreated();
    } catch (err) {
      console.error('[ProfileSetup] Error:', err);
      setError('Failed to create profile. Please try again.');
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

        <p className="text-gray-600 text-center mb-8">
          Set up your child's profile to get started
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
              Child's Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              placeholder="Enter child's name"
            />
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-semibold text-gray-700 mb-2">
              Grade/Class
            </label>
            <input
              type="text"
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              placeholder="e.g., Grade 5"
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