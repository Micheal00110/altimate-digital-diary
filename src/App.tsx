import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase, ChildProfile } from './lib/supabase';
import { ProfileSetup } from './components/ProfileSetup';
import { DiaryEntry } from './components/DiaryEntry';
import { DiaryHistory } from './components/DiaryHistory';
import { Messages } from './components/Messages';
import { Announcements } from './components/Announcements';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { PasswordReset } from './components/PasswordReset';
import { LandingPage } from './components/LandingPage';
import { SyncStatusBar } from './components/SyncStatusBar';
import { ConflictResolver } from './components/ConflictResolver';
import { Bell, MessageCircle, BookOpen, LogOut } from 'lucide-react';

type AuthView = 'landing' | 'login' | 'signup' | 'reset';
type AppView = 'diary' | 'history' | 'messages' | 'announcements';

function AppContent() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('landing');
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('diary');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const loadNotifications = useCallback(async () => {
    try {
      const [messagesRes, announcementsRes] = await Promise.all([
        supabase.from('messages').select('id').eq('is_read', false).eq('sender_type', 'teacher'),
        supabase.from('announcements').select('id').order('created_at', { ascending: false }).limit(5)
      ]);
      if (messagesRes.data) setUnreadMessages(messagesRes.data.length);
      if (announcementsRes.data) setUnreadAnnouncements(announcementsRes.data.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log('[App] User logged in:', user);
      checkProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      console.log('[App] Profile loaded:', profile);
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [profile, loadNotifications]);

  const checkProfile = async () => {
    setLoading(true);
    setDebugInfo('Connecting...');
    console.log('[App] Checking user role:', user?.role);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setDebugInfo('Loading timeout - try refreshing');
    }, 10000);
    
    try {
      // Check child profile - get first one for MVP (legacy schema uses singular)
      const { data, error } = await supabase.from('child_profile').select('*').maybeSingle();
      console.log('[App] child_profile result:', { data, error });

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setDebugInfo('Child profile found');
      } else if (user?.role === 'teacher') {
        // For teachers in legacy mode, create a placeholder profile
        setProfile({
          id: 0,
          name: user.email?.split('@')[0] || 'Teacher',
          grade: '',
          school: '',
          created_at: new Date().toISOString()
        } as ChildProfile);
        setDebugInfo('Teacher profile (legacy mode)');
      } else if (user?.role === 'parent') {
        // For parents in legacy mode, create a placeholder profile
        setProfile({
          id: 0,
          name: user.email?.split('@')[0] || 'Parent',
          grade: '',
          school: '',
          created_at: new Date().toISOString()
        } as ChildProfile);
        setDebugInfo('Parent profile (legacy mode)');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setDebugInfo(`Error: ${err.message || error}`);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleProfileCreated = () => checkProfile();
  const handleViewHistory = () => setCurrentView('history');
  const handleBackToDiary = () => {
    setCurrentView('diary');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };
  const handleSelectDate = (date: string) => setSelectedDate(date);
  const handleBack = () => {
    setCurrentView('diary');
    loadNotifications();
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    setAuthView('login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center p-4">
        <div className="text-gray-600 text-lg mb-4">Loading...</div>
        {debugInfo && (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-300 max-w-md">
            <p className="text-sm text-gray-800 font-mono">{debugInfo}</p>
          </div>
        )}
        {user && (
          <p className="text-sm text-gray-500 mt-2">Logged in as: {user.email} ({user.role})</p>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authView === 'landing' && (
          <LandingPage
            onNavigateToLogin={() => setAuthView('login')}
            onNavigateToSignup={() => setAuthView('signup')}
          />
        )}
        {authView === 'login' && (
          <LoginPage
            onLoginSuccess={() => checkProfile()}
            onNavigateToSignup={() => setAuthView('signup')}
            onNavigateToResetPassword={() => setAuthView('reset')}
          />
        )}
        {authView === 'signup' && (
          <SignupPage
            onSignupSuccess={() => checkProfile()}
            onNavigateToLogin={() => setAuthView('login')}
          />
        )}
        {authView === 'reset' && (
          <PasswordReset onBackToLogin={() => setAuthView('login')} />
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center p-4">
        <div className="text-gray-600 text-lg mb-4">Loading...</div>
        {debugInfo && (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-300 max-w-md">
            <p className="text-sm text-gray-800 font-mono">{debugInfo}</p>
          </div>
        )}
      </div>
    );
  }

  if (!profile) {
    return <ProfileSetup onProfileCreated={handleProfileCreated} />;
  }

  return (
    <>
      <ConflictResolver />
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <SyncStatusBar />
        <button
          onClick={handleSignOut}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {currentView === 'history' && (
        <DiaryHistory onBack={handleBackToDiary} onSelectDate={handleSelectDate} />
      )}

      {currentView === 'messages' && <Messages onBack={handleBack} />}

      {currentView === 'announcements' && <Announcements onBack={handleBack} />}

      {currentView === 'diary' && (
        <DiaryEntry selectedDate={selectedDate} onViewHistory={handleViewHistory} />
      )}

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl px-2 py-2 flex gap-1 border border-gray-200 z-50">
        <NavButton view="diary" currentView={currentView} icon={BookOpen} label="Diary" onClick={() => setCurrentView('diary')} />
        <NavButton view="messages" currentView={currentView} icon={MessageCircle} label="Messages" badge={unreadMessages} onClick={() => { setCurrentView('messages'); loadNotifications(); }} />
        <NavButton view="announcements" currentView={currentView} icon={Bell} label="Alerts" badge={unreadAnnouncements} onClick={() => setCurrentView('announcements')} />
      </div>
    </>
  );
}

function NavButton({ view, currentView, icon: Icon, label, badge, onClick }: {
  view: AppView;
  currentView: AppView;
  icon: React.ElementType;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
        currentView === view ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-amber-50'
      }`}
    >
      <div className="relative">
        <Icon className="w-6 h-6" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <div id="app-root">
      <AppContent />
    </div>
  );
}