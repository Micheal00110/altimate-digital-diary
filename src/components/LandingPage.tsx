import { BookOpen, MessageCircle, Bell, Shield, Users, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">My Child Diary</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onNavigateToLogin}
            className="px-5 py-2.5 text-amber-700 font-medium hover:bg-amber-100 rounded-lg transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onNavigateToSignup}
            className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-md"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ Parents & Teachers</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Keep Track of Your Child's{' '}
            <span className="text-amber-600">Journey</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            A secure digital diary for parents and teachers to communicate, share updates, 
            and stay connected with your child's daily activities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onNavigateToSignup}
              className="px-8 py-4 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-md flex items-center justify-center"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Daily Diary</h3>
            <p className="text-gray-600">
              Record and track daily activities, meals, naps, and learning milestones in one place.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-5">
              <MessageCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Direct Messaging</h3>
            <p className="text-gray-600">
              Stay connected with teachers through secure, real-time messaging anytime.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-5">
              <Bell className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Alerts</h3>
            <p className="text-gray-600">
              Get notified about important announcements, events, and updates instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose My Child Diary?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h4>
                <p className="text-gray-600">
                  Your child's data is encrypted and securely stored. Only authorized parents and teachers can access it.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Parent-Teacher Connection</h4>
                <p className="text-gray-600">
                  Bridge the gap between home and school with seamless communication tools.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Complete History</h4>
                <p className="text-gray-600">
                  Access a complete timeline of your child's activities and progress over time.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Easy to Use</h4>
                <p className="text-gray-600">
                  Simple, intuitive interface designed for busy parents and teachers on the go.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-10 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Join thousands of families already using My Child Diary
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onNavigateToSignup}
              className="px-8 py-4 bg-white text-amber-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create Free Account
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4 bg-amber-700 text-white font-bold rounded-xl hover:bg-amber-800 transition-colors border border-amber-500"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">My Child Diary</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 My Child Diary. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
