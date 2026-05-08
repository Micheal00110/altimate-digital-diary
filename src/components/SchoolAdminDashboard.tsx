import { useState, useEffect, FormEvent, useCallback } from 'react';
import { supabase, ChildProfile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  Users, GraduationCap, School, Plus, Loader2,
  ShieldCheck, ArrowRight, MessageCircle, Settings, Briefcase,
  CheckCircle, XCircle, Activity, AlertCircle
} from 'lucide-react';

export function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [school, setSchool] = useState<{ id: string; name: string; contact_email?: string; subscription_status?: string } | null>(null);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; email: string; school_id?: string }>>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [analytics, setAnalytics] = useState<{ attendance: any[], behaviour: any[] }>({ attendance: [], behaviour: [] });
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [isLoading, setIsLoading] = useState(true);

   // Connection Form State
   const [selectedTeacherId, setSelectedTeacherId] = useState('');
   const [selectedChildId, setSelectedChildId] = useState('');
   const [isCreating, setIsCreating] = useState(false);
const [isAddingTeacher, setIsAddingTeacher] = useState(false);
   const [isAddingParent, setIsAddingParent] = useState(false);
   const [isEnrolling, setIsEnrolling] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
const [newStudentName, setNewStudentName] = useState('');
   const [newStudentGrade, setNewStudentGrade] = useState('');
   const [newParentName, setNewParentName] = useState('');
   const [newParentPhone, setNewParentPhone] = useState('');
   const [newParentEmail, setNewParentEmail] = useState('');
   const [msg, setMsg] = useState({ type: '', text: '' });

   const loadSchoolData = useCallback(async () => {
     if (!user) return;
     setIsLoading(true);
     try {
       const schoolId = user.school_id;
       
       if (schoolId) {
         const { data: schoolData } = await supabase.from('schools').select('*').eq('id', schoolId).single();
         setSchool(schoolData);

         const { data: teachersData } = await supabase.from('users').select('*').eq('user_type', 'teacher').eq('school_id', schoolId);
         setTeachers(teachersData || []);

          const { data: studentsData } = await supabase.from('child_profile').select('*').eq('school_id', schoolId);
          setChildren(studentsData || []);

          // Fetch Analytics (Last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const { data: attendanceData } = await supabase
            .from('school_attendance_analytics')
            .select('*')
            .eq('school_id', schoolId)
            .gte('date', sevenDaysAgo.toISOString().split('T')[0]);
            
          setAnalytics(prev => ({ ...prev, attendance: attendanceData || [] }));
        }
     } catch (err: unknown) {
       console.error('Failed to load school admin data', err);
     } finally {
       setIsLoading(false);
     }
   }, [user]);

   useEffect(() => {
     loadSchoolData();
   }, [loadSchoolData]);

const handleAddTeacher = async (e: FormEvent) => {
     e.preventDefault();
     const schoolId = user?.school_id;
     if (!schoolId) return;

     setIsAddingTeacher(true);
     try {
       const { error } = await supabase.from('users').insert([{
         name: newTeacherName,
         email: newTeacherEmail,
         user_type: 'teacher',
         school_id: schoolId
       }]);
       if (error) throw error;
       setMsg({ type: 'success', text: 'Faculty member registered successfully.' });
       setNewTeacherName('');
       setNewTeacherEmail('');
       setIsAddingTeacher(false);
       loadSchoolData();
     } catch (err: unknown) {
       setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add teacher' });
     }
     setIsAddingTeacher(false);
   };

   const handleAddParent = async (e: FormEvent) => {
     e.preventDefault();
     const schoolId = user?.school_id;
     if (!schoolId) return;

     setIsAddingParent(true);
     try {
       const { error } = await supabase.from('users').insert([{
         name: newParentName,
         email: newParentEmail || `${newParentPhone.replace(/\D/g, '')}@no-email.com`,
         phone: newParentPhone,
         user_type: 'parent',
         school_id: schoolId
       }]);
       if (error) throw error;
       setMsg({ type: 'success', text: 'Parent registered successfully.' });
       setNewParentName('');
       setNewParentEmail('');
       setNewParentPhone('');
       setIsAddingParent(false);
       loadSchoolData();
     } catch (err: unknown) {
       setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add parent' });
     }
     setIsAddingParent(false);
   };

  const handleManualEnrollment = async (e: FormEvent) => {
    e.preventDefault();
    const schoolId = user?.school_id;
    if (!schoolId || !school) return;

    setIsEnrolling(true);
    try {
      const { error: childErr } = await supabase.from('child_profile').insert([{
        name: newStudentName,
        grade: newStudentGrade,
        school: school.name,
        school_id: schoolId
      }]);
      
      if (childErr) throw childErr;

      const { error: parentErr } = await supabase.from('users').insert([{
        name: newParentName,
        email: `${newParentPhone.replace(/\D/g, '')}@no-email.com`,
        user_type: 'parent',
        school_id: schoolId
      }]);

      if (parentErr) throw parentErr;

       setMsg({ type: 'success', text: `Enrolled student ${newStudentName} and parent ${newParentName}.` });
       setNewStudentName('');
       setNewParentName('');
       setNewParentPhone('');
       loadSchoolData();
      } catch (err: unknown) {
        setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Enrollment failed' });
      }
     setIsEnrolling(false);
  };

   const handleCreateConnection = async (e: FormEvent) => {
     e.preventDefault();
     if (!selectedTeacherId || !selectedChildId || !school) return;

     setIsCreating(true);
     try {
       const { error } = await supabase.from('child_enrollments').insert([{
         child_id: selectedChildId,
         teacher_id: selectedTeacherId,
         school_id: school.id,
         class_year: `${new Date().getFullYear()}`,
         status: 'active'
       }]);
        if (error) throw error;
        setMsg({ type: 'success', text: 'Connection established.' });
      } catch {
        setMsg({ type: 'error', text: 'Failed to establish connection.' });
      }
     setIsCreating(false);
   };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Institutional Data...</p>
      </div>
    );
  }

  const totalPresent = analytics.attendance.filter(a => a.attendance === 'present').reduce((acc, curr) => acc + curr.student_count, 0);
  const totalLate = analytics.attendance.filter(a => a.attendance === 'late').reduce((acc, curr) => acc + curr.student_count, 0);
  const totalAbsent = analytics.attendance.filter(a => a.attendance === 'absent').reduce((acc, curr) => acc + curr.student_count, 0);
  const attendanceRate = children.length > 0 ? Math.round((totalPresent / children.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* SCHOOL HEADER */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/50 mb-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="bg-orange-600 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-200">
              <School className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{school?.name || 'Academic Institution'}</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Verified School Administrator Panel
              </p>
            </div>
          </div>
          <div className="relative z-10 flex gap-3 overflow-x-auto pb-2 md:pb-0">
             <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
             >
                <School className="w-4 h-4" />
                Overview
             </button>
             <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-orange-600 text-white shadow-xl' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
             >
                <Activity className="w-4 h-4" />
                Analytics
             </button>
             <button className="px-6 py-3 bg-white text-slate-400 rounded-2xl font-bold text-xs border border-slate-100 flex items-center gap-2 cursor-not-allowed whitespace-nowrap">
                <Settings className="w-4 h-4" />
                Settings
             </button>
          </div>
         </div>

         {/* MESSAGE DISPLAY */}
         {msg.text && (
           <div className={`p-4 rounded-2xl text-sm font-bold border mb-6 flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
             {msg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
             {msg.text}
           </div>
         )}

         {activeTab === 'analytics' ? (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Today's Attendance</p>
                    <div className="text-4xl font-black text-slate-900 mb-4">{attendanceRate}%</div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-emerald-500 h-full" style={{ width: `${attendanceRate}%` }}></div>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Punctuality Index</p>
                    <div className="text-4xl font-black text-slate-900 mb-4">{totalLate} <span className="text-lg text-slate-400 font-bold">Late today</span></div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-amber-500 h-full" style={{ width: '15%' }}></div>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Safety Alerts</p>
                    <div className="text-4xl font-black text-red-600 mb-4">{totalAbsent} <span className="text-lg text-red-300 font-bold">Unaccounted</span></div>
                    <p className="text-[10px] font-bold text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Requires urgent follow-up</p>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                 <h3 className="text-2xl font-black mb-8 relative z-10">Institutional Performance</h3>
                 <div className="space-y-6 relative z-10">
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'].map(grade => (
                       <div key={grade} className="flex items-center gap-6">
                          <div className="w-20 text-xs font-bold text-slate-400">{grade}</div>
                          <div className="flex-1 bg-white/5 h-8 rounded-xl overflow-hidden flex">
                             <div className="bg-emerald-500/80 h-full" style={{ width: '75%' }}></div>
                             <div className="bg-amber-500/80 h-full" style={{ width: '15%' }}></div>
                             <div className="bg-red-500/80 h-full" style={{ width: '10%' }}></div>
                          </div>
                          <div className="w-12 text-right text-xs font-black">90%</div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
             <div className="space-y-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                     <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                       <GraduationCap className="w-6 h-6" />
                     </div>
                     <span className="text-3xl font-black text-slate-900">{teachers.length}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Faculty Members</h3>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                     <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                       <Users className="w-6 h-6" />
                     </div>
                     <span className="text-3xl font-black text-slate-900">{children.length}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Enrolled Students</h3>
               </div>

               <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <MessageCircle className="w-20 h-20" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">School Bulletin</h3>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">Broadcast an announcement to all parents and teachers in your school.</p>
                  <button className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-white hover:text-slate-900 transition-all">Create Announcement</button>
               </div>
             </div>

             <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-orange-500" />
                          Active Faculty
                       </h3>
                       <button 
                         onClick={() => setIsAddingTeacher(!isAddingTeacher)}
                         className="text-xs font-bold text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl transition-all"
                       >
                         {isAddingTeacher ? 'Cancel' : 'Add Teacher'}
                       </button>
                    </div>

                    {isAddingTeacher && (
                      <div className="p-8 bg-orange-50/50 border-b border-orange-100 animate-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleAddTeacher} className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teacher Full Name</label>
                            <input 
                              type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-orange-500"
                              placeholder="e.g. Mr. David Smith" required
                            />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                            <input 
                              type="email" value={newTeacherEmail} onChange={e => setNewTeacherEmail(e.target.value)}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-orange-500"
                              placeholder="david@school.com" required
                            />
                          </div>
                          <button className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 shadow-lg shadow-orange-100">
                            Register
                          </button>
                        </form>
                      </div>
                    )}
                   <div className="divide-y divide-slate-50">
                      {teachers.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm font-medium">No teachers registered to your school yet.</div>
                      ) : (
                        teachers.map(teacher => (
                          <div key={teacher.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg">
                                   {teacher.name.charAt(0)}
                                </div>
                                <div>
                                   <h4 className="text-sm font-bold text-slate-900">{teacher.name}</h4>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{teacher.email}</p>
                                </div>
                             </div>
                             <button className="p-2 text-slate-300 hover:text-orange-600 transition-colors"><ArrowRight className="w-5 h-5" /></button>
                          </div>
                        ))
                      )}
                   </div>
                </div>

<div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-amber-500" />
                        Manual Enrollment
                     </h3>
                     <p className="text-slate-500 text-xs font-medium mb-6 italic">Use this for parents who need help setting up their account.</p>
                     <form onSubmit={handleManualEnrollment} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Name</label>
                              <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" required />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
                              <input type="text" value={newStudentGrade} onChange={e => setNewStudentGrade(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" required />
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Name</label>
                              <input type="text" value={newParentName} onChange={e => setNewParentName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" required />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                              <input type="tel" value={newParentPhone} onChange={e => setNewParentPhone(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" required />
                           </div>
                        </div>
                        <button disabled={isEnrolling} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-all shadow-lg">
                           {isEnrolling ? 'Processing...' : 'Enroll Student & Parent'}
                        </button>
                     </form>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                           <Users className="w-5 h-5 text-emerald-500" />
                           Add Parent Account
                        </h3>
                        <button 
                          onClick={() => setIsAddingParent(!isAddingParent)}
                          className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all"
                        >
                          {isAddingParent ? 'Cancel' : 'Add Parent'}
                        </button>
                     </div>
                     <p className="text-slate-500 text-xs font-medium mb-6 italic">Register a parent account independently of student enrollment.</p>

                     {isAddingParent && (
                       <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                         <form onSubmit={handleAddParent} className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Full Name</label>
                               <input 
                                 type="text" value={newParentName} onChange={e => setNewParentName(e.target.value)}
                                 className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                                 placeholder="e.g. Mrs. Sarah Johnson" required
                               />
                             </div>
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                               <input 
                                 type="tel" value={newParentPhone} onChange={e => setNewParentPhone(e.target.value)}
                                 className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                                 placeholder="+1 234 567 8900" required
                               />
                             </div>
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                             <input 
                               type="email" value={newParentEmail} onChange={e => setNewParentEmail(e.target.value)}
                               className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                               placeholder="parent@example.com"
                             />
                           </div>
                           <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                             Register Parent
                           </button>
                         </form>
                       </div>
                     )}
                  </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-emerald-500" />
                      Quick Link Tool
                   </h3>
                   <form onSubmit={handleCreateConnection} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Teacher</label>
                         <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none">
                           <option value="">Choose Teacher</option>
                           {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Student</label>
                         <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none">
                           <option value="">Choose Student</option>
                           {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                       <button disabled={isCreating} className="md:col-span-2 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100 disabled:opacity-50">
                          {isCreating ? 'Linking...' : 'Link Record'}
                       </button>
                   </form>
                </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
