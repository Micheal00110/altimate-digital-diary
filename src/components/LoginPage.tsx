import { useState, useContext, FormEvent } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { authService } from '../lib/auth';
import { Mail, Lock, Eye, EyeOff, Phone, User, GraduationCap, School, Globe, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToSignup: () => void;
  onNavigateToResetPassword: () => void;
}

export function LoginPage({ onLoginSuccess, onNavigateToSignup, onNavigateToResetPassword }: LoginPageProps) {
  const auth = useContext(AuthContext);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setError('');
    setIsLoading(true);

    const identifier = loginMethod === 'email' ? email : phone;
    const result = await auth.signIn(identifier, password);

    if (result && !result.error) {
      onLoginSuccess();
    } else {
      setError(result?.error?.message || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const result = await authService.requestLoginOTP(email);
    
    if (result.success) {
      setOtpSent(true);
      const otpData = result.data as { otp?: string } | undefined;
      const otpCode = otpData?.otp || '123456';
      setOtp(otpCode);
      console.log('[Login] OTP:', otpCode);
    } else {
      setError(result.error || 'Failed to send OTP');
    }
    
    setIsLoading(false);
  };

  const handleOtpLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setError('');
    setIsLoading(true);
    
    const result = await authService.verifyLoginOTP(email, otp);
    
    if (result.success) {
      setOtp('');
      setOtpSent(false);
      onLoginSuccess();
    } else {
      setError(result.error || 'Invalid OTP');
    }
    
    setIsLoading(false);
  };

  const handleSubmit = loginMode === 'password' ? handlePasswordLogin : handleOtpLogin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background orbs */}
      <motion.div 
        className="absolute w-96 h-96 bg-amber-200/30 rounded-full -top-20 -left-20 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute w-72 h-72 bg-orange-200/30 rounded-full -bottom-20 -right-20 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Login with</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  loginMethod === 'email'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  loginMethod === 'phone'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setLoginMode('password'); setLoginMethod('email'); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  loginMode === 'password'
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Lock className="w-3 h-3" />
                Password
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('otp'); setLoginMethod('email'); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  loginMode === 'otp'
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <KeyRound className="w-3 h-3" />
                OTP Login
              </button>
            </div>

            {loginMethod === 'email' ? (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="you@example.com"
                  name="email"
                  autoComplete="email"
                  required={loginMethod === 'email'}
                />
              </div>
            ) : (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="+1 (555) 000-0000"
                  name="phone"
                  autoComplete="tel"
                  required={loginMethod === 'phone'}
                />
              </div>
            )}
          </div>

          {loginMode === 'password' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateToResetPassword}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter your password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}

          {loginMode === 'otp' && !otpSent && (
            <motion.button
              type="button"
              onClick={handleRequestOtp}
              disabled={isLoading || !email}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
            </motion.button>
          )}

          {loginMode === 'otp' && otpSent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-green-700 text-center font-medium">
                  Your OTP: <span className="text-lg font-bold text-green-800">{otp}</span>
                </p>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center tracking-widest font-mono text-lg"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </motion.button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue as</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={() => {
                if (auth) {
                  auth.signInAsGuest('parent');
                  onLoginSuccess();
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-2 bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-500 hover:text-amber-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
            >
              <User className="w-4 h-4" />
              Parent
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                if (auth) {
                  auth.signInAsGuest('teacher');
                  onLoginSuccess();
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-2 bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-500 hover:text-amber-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
            >
              <GraduationCap className="w-4 h-4" />
              Teacher
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                if (auth) {
                  auth.signInAsGuest('admin');
                  onLoginSuccess();
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-2 bg-white border-2 border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
            >
              <School className="w-4 h-4" />
              Principal
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                if (auth) {
                  auth.signInAsGuest('super_admin');
                  onLoginSuccess();
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-2 bg-amber-600 border-2 border-amber-600 text-white hover:bg-orange-600 hover:border-orange-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-100"
            >
              <Globe className="w-4 h-4" />
              Investor
            </motion.button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToSignup}
              className="text-amber-600 hover:text-amber-700 font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}