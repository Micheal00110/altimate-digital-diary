import { useState, useEffect } from 'react';
import { ChildProfile, supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'diary_update';
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}
import { ClassList } from './components/ClassList';
import { DiaryEntry } from './components/DiaryEntry';
import { DiaryHistory } from './components/DiaryHistory';
import { MyConnections } from './components/MyConnections';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { PasswordReset } from './components/PasswordReset';
import { AdminDashboard as InvestorHub } from './components/AdminDashboard';
import { SchoolAdminDashboard } from './components/SchoolAdminDashboard';
import { Messaging } from './components/Messaging';
import { ChildEnrollment } from './lib/connections';
import {
  Users, LogOut, LayoutDashboard,
  Globe, Bell, X, CheckCircle2, MessageSquare, UserCircle, BookOpen, ChevronDown
} from 'lucide-react';

// ============================================
// AUTH VIEW TYPES
// ============================================
type AuthView = 'landing' | 'login' | 'signup' | 'reset';

// ============================================
// APP VIEW TYPES
// ============================================
type AppView = 'class-list' | 'diary' | 'history' | 'connections' | 'investor-hub' | 'school-dashboard' | 'messaging';

// ============================================
// AUTHENTICATED APP CONTENT
// ============================================
function AuthenticatedApp() {
  const { user, signOut } = useAuth();
  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';
  const isParent = userRole === 'parent';
  const isSchoolAdmin = userRole === 'admin';
  const isSuperAdmin = userRole === 'super_admin';

  const [currentView, setCurrentView] = useState<AppView>(
    isSuperAdmin ? 'investor-hub' : 
    isSchoolAdmin ? 'school-dashboard' : 
    isTeacher ? 'class-list' : 'connections'
  );
  const [selectedStudent, setSelectedStudent] = useState<ChildProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [myChildren, setMyChildren] = useState<ChildProfile[]>([]);
  const [showChildSwitcher, setShowChildSwitcher] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [activeChat, setActiveChat] = useState<{ childId: string; recipientId: string; childName: string } | null>(null);

  // Fetch and Subscribe to Notifications
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: { new: Notification }) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch all children linked to this parent
  useEffect(() => {
    if (isParent && user?.id) {
      const fetchMyChildren = async () => {
        const { data } = await supabase
          .from('child_enrollments')
          .select('child_id, child_profile(*)')
          .eq('parent_id', user.id);

         if (data) {
           const children = data.map((d: { child_profile: ChildProfile[] }) => d.child_profile).flat().filter((cp: ChildProfile): cp is ChildProfile => !!cp);
           setMyChildren(children);
           // Auto-select first child if none selected
           if (children.length > 0 && !selectedStudent) {
             setSelectedStudent(children[0]);
           }
         }
      };
      fetchMyChildren();
    }
  }, [isParent, user?.id, selectedStudent]);

  const handleSelectStudent = (student: ChildProfile) => {
    setSelectedStudent(student);
    setCurrentView('diary');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleBackToClassList = () => {
    setCurrentView('class-list');
    setSelectedStudent(null);
  };

  const handleBackToConnections = () => {
    setCurrentView('connections');
    setSelectedStudent(null);
  };

  const handleViewHistory = () => setCurrentView('history');
  
  const handleBackToDiary = () => setCurrentView('diary');

  return (
    <>
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50 px-4 py-3 flex justify-between items-center">
        <div className="font-bold text-amber-800 flex items-center gap-2">
          {isTeacher ? (
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold border border-amber-300 flex items-center gap-1">
              <UserCircle className="w-3 h-3" /> TEACHER
            </span>
          ) : isParent ? (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold border border-blue-300 flex items-center gap-1">
              <UserCircle className="w-3 h-3" /> PARENT
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold border border-gray-300">
              {userRole?.toUpperCase() || 'USER'}
            </span>
          )}

          {/* Child Switcher for Parents */}
          {isParent && myChildren.length > 1 && (
            <div className="relative">
              <button 
                onClick={() => setShowChildSwitcher(!showChildSwitcher)}
                className="flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-all"
              >
                {selectedStudent?.name || 'Select Child'}
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showChildSwitcher && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-50 bg-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Switch Profile</p>
                  </div>
                  {myChildren.map(child => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSelectedStudent(child);
                        setShowChildSwitcher(false);
                        setCurrentView('diary');
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${selectedStudent?.id === child.id ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {child.name}
                      {selectedStudent?.id === child.id && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Management Buttons */}
          {(isParent || isTeacher) && (
            <button
              onClick={() => setCurrentView('connections')}
              className={`text-sm p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all font-medium flex items-center gap-1.5 ${
                currentView === 'connections' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Connections</span>
            </button>
          )}

          {isSchoolAdmin && (
            <button
              onClick={() => setCurrentView('school-dashboard')}
              className={`text-sm p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all font-bold flex items-center gap-1.5 ${
                currentView === 'school-dashboard' 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Principal</span>
            </button>
          )}

          {/* NOTIFICATION BELL */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Alerts Center</h3>
                  <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs font-medium">No new alerts</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-amber-50/30' : ''}`}>
                         <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'message' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                               {n.type === 'message' ? <MessageSquare className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-900 mb-0.5">{n.title}</p>
                               <p className="text-[11px] text-slate-500 leading-tight mb-2">{n.content}</p>
                               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setCurrentView('investor-hub')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1 ${
                currentView === 'investor-hub' 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Investor Hub</span>
            </button>
          )}
          
          {/* Main App Navigation */}
          {(currentView === 'diary' || currentView === 'history') && isTeacher && (
            <button
              onClick={handleBackToClassList}
              className="p-2 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors flex items-center gap-2"
              title="Back to Class List"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Class</span>
            </button>
          )}

          {(currentView === 'diary' || currentView === 'history') && isParent && (
            <button
              onClick={handleBackToConnections}
              className="p-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 transition-colors flex items-center gap-2"
              title="Back to Connections"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>
          )}
          
          {/* Messaging & Notifications */}
          {(isParent || isTeacher) && (
            <button className="relative p-2 bg-slate-50 hover:bg-amber-50 rounded-xl text-slate-400 hover:text-amber-600 transition-all">
              <MessageSquare className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></div>
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-14 pb-20">
        {/* Class List / Diary Views */}
        {currentView === 'class-list' && (
          <ClassList onSelectStudent={handleSelectStudent} selectedDate={selectedDate} />
        )}

        {currentView === 'history' && selectedStudent && (
          <DiaryHistory 
            onBack={handleBackToDiary} 
            onSelectDate={(date) => {
              setSelectedDate(date);
              setCurrentView('diary');
            }}
            student={selectedStudent}
          />
        )}

        {currentView === 'diary' && selectedStudent && (
          <DiaryEntry 
            selectedDate={selectedDate} 
            onViewHistory={handleViewHistory}
            student={selectedStudent}
            role={userRole === 'parent' ? 'parent' : 'teacher'}
          />
        )}

        {/* Phase 2: Connection Management Views */}
        {currentView === 'connections' && (
          <MyConnections 
            onMessageClick={(connection: ChildEnrollment) => {
              const isTeacher = user?.role === 'teacher';
              const recipientId = isTeacher ? connection.parent_id : connection.teacher_id;
              setActiveChat({
                childId: connection.child_id,
                recipientId: recipientId,
                childName: connection.child?.name || 'Student'
              });
              setCurrentView('messaging');
            }}
            onViewDiary={async (childId) => {
              const { data, error } = await supabase
                .from('child_profile')
                .select('*')
                .eq('id', childId)
                .single();
              
              if (data) {
                setSelectedStudent(data);
                setCurrentView('diary');
                setSelectedDate(new Date().toISOString().split('T')[0]);
              } else if (error) {
                console.error('Failed to load child profile:', error);
              }
            }}
          />
        )}

        {currentView === 'messaging' && activeChat && (
          <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-120px)]">
            <Messaging 
              childId={activeChat.childId}
              recipientId={activeChat.recipientId}
              childName={activeChat.childName}
              onClose={() => setCurrentView('connections')}
            />
          </div>
        )}

        {/* Admin Views */}
        {currentView === 'investor-hub' && isSuperAdmin && (
          <InvestorHub />
        )}

        {currentView === 'school-dashboard' && isSchoolAdmin && (
          <SchoolAdminDashboard />
        )}
      </div>
    </>
  );
}

// ============================================
// AUTH FLOW
// ============================================
function AuthFlow() {
  const [authView, setAuthView] = useState<AuthView>('landing');

  switch (authView) {
    case 'landing':
      return (
        <LandingPage 
          onNavigateToSignup={() => setAuthView('signup')}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    
    case 'login':
      return (
        <LoginPage 
          onLoginSuccess={() => {}}
          onNavigateToSignup={() => setAuthView('signup')}
          onNavigateToResetPassword={() => setAuthView('reset')}
        />
      );
    
    case 'signup':
      return (
        <SignupPage 
          onSignupSuccess={() => setAuthView('login')}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    
    case 'reset':
      return (
        <PasswordReset 
          onBackToLogin={() => setAuthView('login')}
        />
      );
    
    default:
      return <LandingPage onNavigateToSignup={() => setAuthView('signup')} onNavigateToLogin={() => setAuthView('login')} />;
  }
}

// ============================================
// MAIN APP
// ============================================
function AppContent() {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth flow if no user
  if (!user) {
    return <AuthFlow />;
  }

  // Show authenticated app
  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <div id="app-root">
      <AppContent />
    </div>
  );
}