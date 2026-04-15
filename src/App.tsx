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
    setDebugInfo('Godmode: Initializing universal sync...');
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setDebugInfo('Profile check timed out - falling back to safety mode.');
    }, 10000);
    
    try {
      setDebugInfo('Searching all tables...');
      
      // Attempt 1: Check plural 'child_profiles'
      const { data: modernData } = await supabase
        .from('child_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (modernData) {
        setProfile(modernData as ChildProfile);
        setDebugInfo('Connected (Plural Table)');
      } else {
        // Attempt 2: Check singular 'child_profile'
        const { data: legacyData } = await supabase
          .from('child_profile')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (legacyData) {
          setProfile(legacyData as ChildProfile);
          setDebugInfo('Connected (Singular Table)');
        } else {
          setProfile(null);
          setDebugInfo('Status: Ready for profile setup.');
        }
      }
    } catch (error: unknown) {
      console.error('[App] Godmode fetch failed:', error);
      setDebugInfo('Sync failed - please click "Force Access" if stuck.');
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center p-4">
        <div className="text-gray-600 text-lg mb-4">Loading Auth...</div>
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
    return <ProfileSetup onProfileCreated={handleProfileCreated} onBypass={(p) => setProfile(p)} />;
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

      {/* Persistence Diagnostic Overlay */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 text-[10px] text-gray-300 font-mono px-4 py-1 z-[100] flex justify-between items-center backdrop-blur-sm">
        <div className="flex gap-4">
          <span>USER: <span className="text-green-400">{user?.id?.substring(0,8) || 'NONE'}</span></span>
          <span>ROLE: <span className="text-amber-400">{user?.role || 'NONE'}</span></span>
          <span>PROFILE: <span className={profile ? "text-green-400" : "text-red-400"}>{profile ? 'FOUND' : 'MISSING'}</span></span>
        </div>
        <div className="truncate max-w-[50%]">
          LOG: <span className="text-blue-300">{debugInfo}</span>
        </div>
        <button 
          onClick={() => checkProfile()} 
          className="ml-4 px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          RE-CHECK
        </button>
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