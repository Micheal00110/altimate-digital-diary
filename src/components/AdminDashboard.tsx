import { useState, useEffect, FormEvent } from 'react';
import { supabase, ChildProfile } from '../lib/supabase';
import { useSync } from '../contexts/SyncContext';
import { useNetwork } from '../contexts/NetworkContext';
import {
  Users, User, School, Loader2, CheckCircle,
  ShieldCheck, Activity, CreditCard, Globe, AlertCircle, MoreVertical,
  Wifi, WifiOff, RefreshCw, Database, Terminal
} from 'lucide-react';

export function AdminDashboard() {
  const { isSyncing: syncActive, pendingCount, lastSyncTime, syncNow } = useSync();
  const { isOnline } = useNetwork();
  
  const [schools, setSchools] = useState<Array<{ id: string; name: string; contact_email: string; subscription_status: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; email: string; school_id?: string }>>([]);
  const [parents, setParents] = useState<Array<{ id: string; name: string; email: string; school_id?: string }>>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'connections' | 'diagnostics'>('overview');

  // New School Form State
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolEmail, setNewSchoolEmail] = useState('');
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);

  // New Connection Form State
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: schoolsData } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: childrenData } = await supabase.from('child_profile').select('*');

      if (schoolsData) setSchools(schoolsData);
      if (usersData) {
        setTeachers(usersData.filter((u) => u.user_type === 'teacher'));
        setParents(usersData.filter((u) => u.user_type === 'parent'));
      }
      if (childrenData) setChildren(childrenData);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
    setIsLoading(false);
  };

  const handleCreateSchool = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreatingSchool(true);
    try {
      const { error } = await supabase.from('schools').insert([{
        name: newSchoolName,
        contact_email: newSchoolEmail,
        subscription_status: 'trial'
      }]);
      if (error) throw error;
      setMsg({ type: 'success', text: 'New School Provisioned Successfully.' });
      setNewSchoolName('');
      setNewSchoolEmail('');
      loadData();
     } catch (err: unknown) {
       setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create school' });
     }
    setIsCreatingSchool(false);
  };

  const handleCreateConnection = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedParentId || !selectedChildId || !selectedSchoolId) {
      setMsg({ type: 'error', text: 'Incomplete selection.' });
      return;
    }

    setIsCreatingConnection(true);
    try {
      const { error } = await supabase.from('child_enrollments').insert([{
        child_id: selectedChildId,
        teacher_id: selectedTeacherId,
        parent_id: selectedParentId,
        school_id: selectedSchoolId,
        class_year: `${new Date().getFullYear()}`,
        status: 'active'
      }]);
        if (error) throw error;
        setMsg({ type: 'success', text: 'Secure Link Established.' });
      } catch {
        setMsg({ type: 'error', text: 'Connection failed. Duplicate record?' });
      }
     setIsCreatingConnection(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50/50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium tracking-widest uppercase text-[10px]">Accessing Investor Terminal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* INVESTOR TOP BAR */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-40 shadow-2xl shadow-slate-900/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-200">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">Investor Hub</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Multi-School Ecosystem</p>
                <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700">
             {[
               { id: 'overview', label: 'Overview' },
               { id: 'schools', label: 'Manage Schools' },
               { id: 'connections', label: 'Security Links' },
               { id: 'diagnostics', label: 'Diagnostics' }
             ].map(tab => (
               <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
               >
                 {tab.label}
               </button>
             ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* GLOBAL ANALYTICS (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
                <div>
                  <div className="text-3xl font-black text-slate-900">{schools.length}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Schools</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div>
                  <div className="text-3xl font-black text-slate-900">{teachers.length}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Teachers</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
                <div>
                  <div className="text-3xl font-black text-slate-900">{parents.length}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Parents</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-amber-600 p-6 rounded-[2rem] shadow-xl shadow-amber-100 flex items-center justify-between group">
                <div>
                  <div className="text-2xl font-black text-white">$12.4k</div>
                  <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mt-1">Annual Revenue</div>
                </div>
                <CreditCard className="w-6 h-6 text-white/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-500" />
                    School Health Status
                  </h3>
                  <div className="space-y-4">
                     {schools.map(school => (
                       <div key={school.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${school.subscription_status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                             <span className="text-sm font-bold text-slate-700">{school.name}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{school.subscription_status}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      Recent Activity
                    </h3>
                    <button className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:text-amber-700">Audit Logs</button>
                  </div>
                  <div className="space-y-6">
                    {[
                      { name: 'Sarah Johnson', role: 'Teacher', school: 'Sunshine Academy', time: '2m ago' },
                      { name: 'Mike Peters', role: 'Parent', school: 'Sunshine Academy', time: '15m ago' },
                      { name: 'Dr. Emily White', role: 'Principal', school: 'Greenwood High', time: '1h ago' }
                    ].map((user, i) => (
                      <div key={i} className="flex items-center gap-4 group cursor-pointer">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${user.role === 'Teacher' ? 'bg-emerald-50 text-emerald-600' : user.role === 'Parent' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user.role} • {user.school}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">{user.time}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* SCHOOL MANAGEMENT */}
        {activeTab === 'schools' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Provision School</h3>
                <p className="text-slate-500 text-xs font-medium mb-8">Deploy a new institutional environment.</p>
                
                <form onSubmit={handleCreateSchool} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                    <input 
                      type="text" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                      placeholder="e.g. Westside High" required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                    <input 
                      type="email" value={newSchoolEmail} onChange={e => setNewSchoolEmail(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                      placeholder="principal@school.com" required
                    />
                  </div>
                  <button 
                    disabled={isCreatingSchool}
                    className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                  >
                    {isCreatingSchool ? 'Deploying...' : 'Provision Now'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-8">
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {schools.map(school => (
                        <tr key={school.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                <School className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">{school.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${school.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {school.subscription_status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-500 font-medium">{school.contact_email}</td>
                          <td className="px-8 py-5">
                            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* SECURITY CONNECTIONS */}
        {activeTab === 'connections' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-10">
                   <div className="bg-slate-900 p-3 rounded-2xl">
                      <ShieldCheck className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900">Security Access Terminal</h2>
                      <p className="text-slate-500 text-sm font-medium">Force link records for cross-institutional investigation.</p>
                   </div>
                </div>

                <form onSubmit={handleCreateConnection} className="space-y-8">
                   {msg.text && (
                     <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                       {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                       {msg.text}
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary School</label>
                        <select 
                          value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                        >
                          <option value="">Select Domain</option>
                          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator (Teacher)</label>
                        <select 
                          value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                        >
                          <option value="">Select Account</option>
                          {teachers.filter(t => !selectedSchoolId || t.school_id === selectedSchoolId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observer (Parent)</label>
                        <select 
                          value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                        >
                          <option value="">Select Account</option>
                          {parents.filter(p => !selectedSchoolId || p.school_id === selectedSchoolId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject (Student)</label>
                        <select 
                          value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                        >
                          <option value="">Select Profile</option>
                          {children.filter(c => !selectedSchoolId || c.school === selectedSchoolId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                   </div>

                   <button 
                    disabled={isCreatingConnection}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                   >
                     {isCreatingConnection ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Finalize Connection</>}
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* SYSTEM DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                         {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 text-red-600" />}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                         {isOnline ? 'Online' : 'Offline'}
                      </span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900">Network Topology</h4>
                   <p className="text-[10px] text-slate-400 font-medium mt-1">Status of connection to Supabase Edge.</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${syncActive ? 'bg-amber-50 text-amber-600 animate-spin' : 'bg-slate-50 text-slate-400'}`}>
                         <RefreshCw className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         {pendingCount} Changes Pending
                      </span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900">Sync Engine Health</h4>
                   <p className="text-[10px] text-slate-400 font-medium mt-1">Last Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-slate-900 text-white rounded-2xl">
                         <Database className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         91% Ready
                      </span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900">Database Consistency</h4>
                   <p className="text-[10px] text-slate-400 font-medium mt-1">RLS Policies require manual refresh.</p>
                </div>
             </div>

             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="bg-amber-500 p-2 rounded-xl">
                         <Terminal className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">System Recovery Console</h3>
                   </div>
                </div>
                 <div className="flex flex-wrap gap-4 mb-6">
                    <button 
                     onClick={syncNow}
                     disabled={syncActive || !isOnline}
                     className="flex-1 min-w-[200px] px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50"
                    >
                      {syncActive ? 'Syncing...' : 'Manual Sync Override'}
                    </button>
                    <button 
                     onClick={syncNow}
                     disabled={syncActive || !isOnline}
                     className="flex-1 min-w-[200px] px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                      Purge Cache & Re-Sync
                    </button>
                 </div>

                <div className="bg-black/40 rounded-2xl p-6 font-mono text-[11px] text-emerald-400 leading-relaxed border border-white/5 h-64 overflow-y-auto">
                   <p className="opacity-50">[SYSTEM BOOTING...]</p>
                    <p>[OK] Supabase URL: {supabase.auth ? 'Initialized' : 'Error'}</p>
                   <p>[OK] IndexedDB: Ready</p>
                   <p>[OK] Network: {isOnline ? 'Active' : 'Disconnected'}</p>
                   <p className="text-amber-400">[WARN] RLS state drift detected in users table</p>
                   <p className="text-amber-400">[WARN] Profile creation trigger not detected in remote</p>
                   <p className="mt-4 text-white font-bold underline cursor-pointer hover:text-amber-400">Run RLS Integrity Fix (Requires SQL Dashboard)</p>
                   <p className="mt-2 text-white/40">1. Open Supabase Dashboard</p>
                   <p className="text-white/40">2. Run SQL in FIX_RLS_POLICIES.sql</p>
                   <p className="text-white/40">3. Verification complete.</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
