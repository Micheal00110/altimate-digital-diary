import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { authService } from '../lib/auth';
import { Mail, Lock, Eye, EyeOff, User, Building, GraduationCap, Phone, Wand2, Copy, Check, Sparkles } from 'lucide-react';
import { generatePassword, generateMemorablePassword, copyToClipboard } from '../lib/passwordGenerator';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

export function SignupPage({ onSignupSuccess, onNavigateToLogin }: SignupPageProps) {
  const auth = useContext(AuthContext);
  const [userType, setUserType] = useState<'teacher' | 'parent'>('parent');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    school_name: '',
    class_grade: '',
    qualification: '',
    subject_specialization: '',
    years_of_experience: 0,
    bio: '',
    relationship_to_child: 'mother' as 'mother' | 'father' | 'guardian',
    phone_number: '',
    occupation: '',
    emergency_contact: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [passwordGeneratorType, setPasswordGeneratorType] = useState<'secure' | 'memorable'>('secure');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    console.log('[Signup] Starting signup for:', formData.email, 'as', userType);
    setIsLoading(true);

    const baseData = { name: formData.name, email: formData.email };

    let result;
    if (userType === 'teacher') {
      result = await authService.signUpTeacher({
        ...baseData,
        school_name: formData.school_name,
        class_grade: formData.class_grade,
        qualification: formData.qualification,
        subject_specialization: formData.subject_specialization,
        years_of_experience: formData.years_of_experience,
        bio: formData.bio
      }, formData.password);
    } else {
      result = await authService.signUpParent({
        ...baseData,
        relationship_to_child: formData.relationship_to_child,
        phone_number: formData.phone_number,
        occupation: formData.occupation,
        emergency_contact: formData.emergency_contact
      }, formData.password);
    }

    console.log('[Signup] Result:', result);

    if (result.success) {
      onSignupSuccess();
    } else {
      setError(result.error || 'Signup failed');
    }

    setIsLoading(false);
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak' };
    if (password.length < 8) return { strength: 2, label: 'Fair' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 4, label: 'Strong' };
    }
    return { strength: 3, label: 'Medium' };
  };

  const handleGeneratePassword = () => {
    const password = passwordGeneratorType === 'secure' 
      ? generatePassword({ length: 16 })
      : generateMemorablePassword(3, '-');
    
    setFormData(prev => ({ 
      ...prev, 
      password,
      confirmPassword: password
    }));
    setCopiedToClipboard(false);
  };

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(formData.password);
    if (success) {
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const { strength, label } = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join My Child Diary</p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (auth) {
              auth.signInAsGuest(userType);
              onSignupSuccess();
            }
          }}
          className="w-full mb-6 py-3 px-4 bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Instant Guest Access (No Signup Required)
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or use standard signup</span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setUserType('parent')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              userType === 'parent'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            I'm a Parent
          </button>
          <button
            type="button"
            onClick={() => setUserType('teacher')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              userType === 'teacher'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            I'm a Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => setShowPasswordGenerator(!showPasswordGenerator)}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                <Wand2 className="w-4 h-4" />
                Generate
              </button>
            </div>
            
            {/* Password Generator */}
            {showPasswordGenerator && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPasswordGeneratorType('secure')}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        passwordGeneratorType === 'secure'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🔐 Secure
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordGeneratorType('memorable')}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        passwordGeneratorType === 'memorable'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ✨ Memorable
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate Password
                  </button>
                  
                  <p className="text-xs text-blue-600">
                    {passwordGeneratorType === 'secure'
                      ? '🔒 Creates strong, random passwords with mixed characters'
                      : '🎯 Creates easy-to-remember passwords with words and numbers'}
                  </p>
                </div>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="At least 6 characters"
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
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${i <= strength ? 'bg-amber-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{label}</span>
                  {formData.password && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {copiedToClipboard ? (
                        <>
                          <Check className="w-3 h-3 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {userType === 'teacher' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="school_name"
                      type="text"
                      value={formData.school_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="Elementary School"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade/Class</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="class_grade"
                      type="text"
                      value={formData.class_grade}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="Grade 3"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input
                    name="qualification"
                    type="text"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="B.Ed, M.A."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                  <input
                    name="years_of_experience"
                    type="number"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Optional)</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Tell us about yourself..."
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select
                    name="relationship_to_child"
                    value={formData.relationship_to_child}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="+1 234 567 8900"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation (Optional)</label>
                <input
                  name="occupation"
                  type="text"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Your profession"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact (Optional)</label>
                <input
                  name="emergency_contact"
                  type="text"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Alternative contact"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}