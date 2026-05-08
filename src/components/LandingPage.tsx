import { BookOpen, MessageCircle, Bell, Shield, Users, Calendar, ArrowRight, Sparkles, Star, Heart, Zap } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">My Child Diary</span>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onNavigateToLogin}
            className="px-5 py-2.5 text-amber-700 font-semibold hover:bg-amber-100 rounded-xl transition-all"
          >
            Sign In
          </button>
          <button
            onClick={onNavigateToSignup}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-lg mb-8 border border-amber-100">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-700">Trusted by 10,000+ Parents & Teachers</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Keep Track of Your Child's{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Journey</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            A secure digital diary for parents and teachers to communicate, share updates,
            and stay connected with your child's daily activities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onNavigateToSignup}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2.5 text-lg"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center text-lg border border-gray-200"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100 group hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Daily Diary</h3>
            <p className="text-gray-600 leading-relaxed">
              Record and track daily activities, meals, naps, and learning milestones in one secure place.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100 group hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Direct Messaging</h3>
            <p className="text-gray-600 leading-relaxed">
              Stay connected with teachers through secure, real-time messaging anytime, anywhere.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100 group hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Instant Alerts</h3>
            <p className="text-gray-600 leading-relaxed">
              Get notified about important announcements, events, and updates instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Why Parents Love Us
          </h2>
          <p className="text-center text-gray-500 mb-12 text-lg">Everything you need to stay connected</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> Privacy First
                </h4>
                <p className="text-gray-600">
                  Your child's data is encrypted and securely stored. Only authorized parents and teachers can access it.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" /> Parent-Teacher Connection
                </h4>
                <p className="text-gray-600">
                  Bridge the gap between home and school with seamless communication tools.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Complete History
                </h4>
                <p className="text-gray-600">
                  Access a complete timeline of your child's activities and progress over time.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Easy to Use
                </h4>
                <p className="text-gray-600">
                  Simple, intuitive interface designed for busy parents and teachers on the go.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 pb-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/30 via-white/50 to-white/30"></div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-amber-100 mb-10">
            Join thousands of families already using My Child Diary
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onNavigateToSignup}
              className="px-10 py-4 bg-white text-amber-600 font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-lg"
            >
              Create Free Account
            </button>
            <button
              onClick={onNavigateToLogin}
              className="px-10 py-4 bg-amber-700 text-white font-bold rounded-2xl hover:bg-amber-800 transition-all border-2 border-amber-400 text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-amber-200 bg-white/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">My Child Diary</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 My Child Diary. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
