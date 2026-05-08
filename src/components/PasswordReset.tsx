import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Settings, ExternalLink, ShieldCheck } from 'lucide-react';

interface PasswordResetProps {
  onBackToLogin: () => void;
}

export function PasswordReset({ onBackToLogin }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'network' | 'config' | 'unknown'>('unknown');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', email)
        .maybeSingle();

      if (!userData) {
        setError('No account found with this email. Please sign up first.');
        setErrorType('unknown');
        setIsLoading(false);
        return;
      }

      const tempPassword = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          temp_password: tempPassword,
          password_reset_pending: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Unable to process request. Please try again.');
        setErrorType('unknown');
      } else {
        setIsSubmitted(true);
        console.log('[Reset] Temp password set for:', email);
        console.log('[Reset] Temp password:', tempPassword);
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError('An error occurred. Please try again.');
      setErrorType('unknown');
    }

    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500"></div>
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Password Reset Ready</h1>
          <p className="text-gray-600 mb-4">Your password has been reset. Use these credentials:</p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-amber-600 mb-1">Use this temporary password to login:</p>
            <code className="text-lg font-mono text-amber-800 font-bold">temp123</code>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            Then change your password in your profile settings.
          </p>
          
          <button
            onClick={onBackToLogin}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500"></div>

        <button
          onClick={onBackToLogin}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-8 transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="ml-2 text-sm font-medium">Back to Sign In</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-2">We'll send you a secure reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className={`rounded-2xl p-4 border ${
              errorType === 'config'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${
                  errorType === 'config' ? 'bg-blue-100' : 'bg-red-100'
                }`}>
                  <AlertCircle className={`w-5 h-5 ${
                    errorType === 'config' ? 'text-blue-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${
                    errorType === 'config' ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    {error}
                  </p>
                </div>
              </div>

              {errorType === 'config' && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Supabase Email Setup</span>
                  </div>
                  <ol className="text-xs text-blue-700 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="bg-blue-200 text-blue-800 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                      <span>Auth → Providers → Email → Enable</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="bg-blue-200 text-blue-800 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                      <span>Auth → URL Configuration → Site URL</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="bg-blue-200 text-blue-800 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                      <span>Auth → Email Templates → Customize</span>
                    </li>
                  </ol>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <a
                      href="https://supabase.com/docs/guides/auth"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      View Supabase Auth Docs
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 focus:bg-white transition-all text-gray-900"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Use an email you have access to
        </p>
      </div>
    </div>
  );
}