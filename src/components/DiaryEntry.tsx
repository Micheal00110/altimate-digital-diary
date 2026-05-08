import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, DiaryEntry as DiaryEntryType, ChildProfile } from '../lib/supabase';
import { Check, Save, Calendar, User as UserIcon, BookOpen, Clipboard, Loader2, CheckCircle2, MessageSquare, Send } from 'lucide-react';

interface DiaryEntryProps {
  selectedDate: string;
  onViewHistory: () => void;
  student: ChildProfile;
  role: 'teacher' | 'parent';
}

export function DiaryEntry({ selectedDate, onViewHistory, student, role }: DiaryEntryProps) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<DiaryEntryType | null>(null);
  const [subject, setSubject] = useState('');
  const [homework, setHomework] = useState('');
  const [teacherComment, setTeacherComment] = useState('');
  const [attendance, setAttendance] = useState<'present' | 'absent' | 'late'>('present');
  const [behaviourNote, setBehaviourNote] = useState('');
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<DiaryEntryType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [guardians, setGuardians] = useState<ChildProfile[]>([]);

  const isTeacher = role === 'teacher';

  const loadEntry = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load Diary Entry
      const { data, error } = await supabase.from('diary_entries').select('*').eq('date', selectedDate).eq('child_id', student.id).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setEntry(data); setSubject(data.subject || ''); setHomework(data.homework || ''); setTeacherComment(data.teacher_comment || '');
        setAttendance(data.attendance || 'present'); setBehaviourNote(data.behaviour_note || ''); setSigned(data.signed || false);
      } else {
        setEntry(null); setSubject(''); setHomework(''); setTeacherComment(''); setAttendance('present'); setBehaviourNote(''); setSigned(false);
      }

         // 2. Load Messages - diary_messages table may have different column names
       const { data: msgData } = await supabase
         .from('diary_messages')
         .select('*')
         .eq('child_id', student.id)
         .order('created_at', { ascending: true });
         if (msgData) {
           // Cast to DiaryEntryType with explicit shape
           setMessages(msgData as unknown as { id: string | number; date: string; child_id?: string | number; subject: string; homework: string; teacher_comment: string; attendance: 'present' | 'absent' | 'late'; behaviour_note: string; signed: boolean; created_at: string; sender_name?: string; content?: string; message?: string }[]);
         } else {
           setMessages([]);
         }

       // 3. Load Guardians (For Teacher view)
       if (isTeacher) {
         const { data: guardData } = await supabase
           .from('child_enrollments')
           .select('parent:users!parent_id(name, email)')
           .eq('child_id', student.id);
         if (guardData) {
           const guardians = guardData.map((g: { parent: { name: string; email: string }[] }) => ({
             id: '',
             name: g.parent[0]?.name || '',
             grade: '',
             school: '',
             email: g.parent[0]?.email || ''
           }));
           setGuardians(guardians);
         }
       }

         } catch (error: unknown) { console.error('Error loading entry:', error); } finally { setLoading(false); }
   }, [selectedDate, student.id, isTeacher]);

  useEffect(() => { loadEntry(); }, [loadEntry]);

  // REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!student.id) return;

    const channel = supabase
      .channel(`diary_messages:${student.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'diary_messages',
          filter: `child_id=eq.${student.id}`
        },
         (payload: { new: DiaryEntryType }) => {
           setMessages(prev => [...prev, payload.new]);
         }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [student.id]);

   const sendMessage = async () => {
     if (!newMessage.trim() || !user) return;
     try {
       const { error } = await supabase.from('diary_messages').insert([{
         child_id: student.id,
         sender_id: user.id,
         content: newMessage
       }]);

       if (error) throw error;

      // 2. Trigger a notification for the recipient
      // For MVP, we notify all parents/teachers linked to this child except the sender
      const { data: enrollmentData } = await supabase
        .from('child_enrollments')
        .select('parent_id, teacher_id')
        .eq('child_id', student.id)
        .single();

      if (enrollmentData) {
        const recipientId = isTeacher ? enrollmentData.parent_id : enrollmentData.teacher_id;
        await supabase.from('notifications').insert([{
          user_id: recipientId,
          type: 'message',
          title: `New message for ${student.name}`,
          content: newMessage.substring(0, 50) + (newMessage.length > 50 ? '...' : ''),
          link: `/diary/${student.id}`
        }]);
      }

      setNewMessage('');
    } catch (err) { console.error('Failed to send message', err); }
  };

  const saveEntry = async () => {
    setSaving(true);
    try {
      const entryData = { date: selectedDate, child_id: student.id, subject, homework, teacher_comment: teacherComment, attendance, behaviour_note: behaviourNote, signed };
      if (entry) { const { error } = await supabase.from('diary_entries').update(entryData).eq('id', entry.id); if (error) throw error; }
      else { const { error } = await supabase.from('diary_entries').insert([entryData]); if (error) throw error; }

      // Trigger Notification for Parent
      if (isTeacher) {
        const { data: enrollmentData } = await supabase
          .from('child_enrollments')
          .select('parent_id')
          .eq('child_id', student.id)
          .single();

        if (enrollmentData) {
          await supabase.from('notifications').insert([{
            user_id: enrollmentData.parent_id,
            type: 'diary_update',
            title: `Diary Update: ${student.name}`,
            content: `A new entry has been recorded for ${selectedDate}.`,
            link: `/diary/${student.id}`
          }]);
        }
      }

      await loadEntry();
    } catch (error) { console.error('Error saving entry:', error); } finally { setSaving(false); }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center pt-16">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="text-gray-600 font-medium">Loading diary entry...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-10">
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/20 overflow-hidden shadow-lg">
               {student.photo_url ? (
                 <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-8 h-8 text-white" />
               )}
             </div>
            <div>
              <p className="text-amber-100 font-black uppercase tracking-widest text-[10px] mb-1">Student Record</p>
              <h2 className="text-xl font-black text-white leading-tight">{student.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-white text-[10px] font-black uppercase tracking-widest">{student.grade}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">School Diary</h1>
              <p className="text-amber-100 flex items-center gap-2 mt-1"><Calendar className="w-4 h-4" /> {formatDate(selectedDate)}</p>
            </div>
            <button onClick={onViewHistory} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all font-semibold">
              <BookOpen className="w-5 h-5" /> History
            </button>
          </div>

          {/* GUARDIAN INFO (For Teachers) */}
          {isTeacher && guardians.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
               <p className="text-[10px] font-black text-amber-200 uppercase tracking-widest mb-3">Linked Guardians</p>
               <div className="flex flex-wrap gap-2">
                  {guardians.map((g, i) => (
                    <div key={i} className="bg-white/10 px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                       <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-[10px] font-bold text-white">{g.name.charAt(0)}</div>
                       <span className="text-xs font-bold text-white">{g.name}</span>
                       <span className="text-[9px] text-amber-200 font-medium">{g.email}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-blue-100">
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Clipboard className="w-4 h-4 text-blue-600" /></div>
              Attendance
            </label>
            <div className="flex flex-wrap gap-3">
              {(['present', 'late', 'absent'] as const).map((status) => (
                <label key={status} className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 cursor-pointer ${!isTeacher && 'opacity-75 cursor-not-allowed'}`}>
                  <input type="radio" name="attendance" value={status} checked={attendance === status} onChange={(e) => setAttendance(e.target.value as 'present' | 'absent' | 'late')} disabled={!isTeacher} className="sr-only" />
                  <span className={`w-full text-center capitalize font-black text-[10px] tracking-widest px-4 py-3 rounded-xl border-2 transition-all ${
                    attendance === status 
                      ? (status === 'present' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : status === 'late' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-100') 
                      : 'bg-white text-slate-400 border-slate-100'
                  }`}>{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="diary_subject" className="block text-sm font-semibold text-gray-700 mb-2">Subject / Topic</label>
                {isTeacher ? (
                  <input 
                    type="text" 
                    id="diary_subject" 
                    name="subject"
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 focus:bg-white transition-all text-gray-900" 
                    placeholder="e.g., Mathematics, English" 
                    autoComplete="off"
                  />
                ) : (
                  <div className="w-full px-4 py-3.5 border-2 border-transparent bg-gray-50 rounded-xl text-gray-800 min-h-[50px]">{subject || <span className="text-gray-400 italic">No subject recorded</span>}</div>
                )}
              </div>
              <div>
                <label htmlFor="behaviour_note" className="block text-sm font-semibold text-gray-700 mb-2">Behaviour Note <span className="text-xs font-normal text-gray-500">(Optional)</span></label>
                {isTeacher ? (
                  <input 
                    type="text" 
                    id="behaviour_note" 
                    name="behaviour_note"
                    value={behaviourNote} 
                    onChange={(e) => setBehaviourNote(e.target.value)} 
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 focus:bg-white transition-all text-gray-900" 
                    placeholder="Good progress today..." 
                    autoComplete="off"
                  />
                ) : (
                  <div className="w-full px-4 py-3.5 border-2 border-transparent bg-gray-50 rounded-xl text-gray-800 min-h-[50px]">{behaviourNote || <span className="text-gray-400 italic">None</span>}</div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="homework_details" className="block text-sm font-semibold text-gray-700 mb-2">Homework Details</label>
              {isTeacher ? (
                <textarea 
                  id="homework_details" 
                  name="homework"
                  value={homework} 
                  onChange={(e) => setHomework(e.target.value)} 
                  rows={3} 
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 focus:bg-white resize-none transition-all text-gray-900" 
                  placeholder="Enter homework details..." 
                  autoComplete="off"
                />
              ) : (
                <div className="w-full px-4 py-3.5 border-2 border-transparent bg-gray-50 rounded-xl text-gray-800 min-h-[100px] whitespace-pre-wrap">{homework || <span className="text-gray-400 italic">No homework recorded</span>}</div>
              )}
            </div>

            <div>
              <label htmlFor="teacher_comment_field" className="block text-sm font-semibold text-gray-700 mb-2">Teacher Comment</label>
              {isTeacher ? (
                <textarea 
                  id="teacher_comment_field" 
                  name="teacher_comment"
                  value={teacherComment} 
                  onChange={(e) => setTeacherComment(e.target.value)} 
                  rows={2} 
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 focus:bg-white resize-none transition-all text-gray-900" 
                  placeholder="Additional notes from teacher..." 
                  autoComplete="off"
                />
              ) : (
                <div className="w-full px-4 py-3.5 border-2 border-transparent bg-gray-50 rounded-xl text-gray-800 min-h-[80px] whitespace-pre-wrap">{teacherComment || <span className="text-gray-400 italic">No comments</span>}</div>
              )}
            </div>

            <div className={`border-t-2 pt-5 mt-5 ${isTeacher ? 'border-gray-200' : 'border-blue-200 bg-blue-50/50 -mx-6 px-6 pb-6 rounded-b-2xl'}`}>
              <label className={`flex items-center gap-4 ${isTeacher ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer group'}`}>
                <div className="relative">
                  <input type="checkbox" checked={signed} onChange={(e) => { if (!isTeacher) setSigned(e.target.checked); }} disabled={isTeacher} className="sr-only" />
                  <div className={`w-10 h-10 border-2 rounded-xl flex items-center justify-center transition-all ${signed ? 'bg-green-500 border-green-500 shadow-lg shadow-green-200' : `bg-white ${isTeacher ? 'border-gray-300' : 'border-gray-400 group-hover:border-green-400'}`}`}>
                    {signed && <Check className="w-5 h-5 text-white" />}
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-800 block">Work Ensured <span className="text-gray-500 font-medium text-sm">(Parent Signature)</span></span>
                  {!isTeacher && !signed && <span className="text-sm text-blue-600 font-medium">Click to sign and acknowledge</span>}
                  {signed && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Signed</span>}
                </div>
              </label>
            </div>

            <button onClick={saveEntry} disabled={saving} className={`w-full font-bold py-4 px-6 rounded-xl transition-all text-lg shadow-lg flex items-center justify-center gap-2 ${isTeacher ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-300 disabled:to-orange-300' : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-emerald-300 disabled:to-green-300'} text-white hover:shadow-xl`}>
              {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> {isTeacher ? 'Update Daily Log' : 'Acknowledge & Sign'}</>}
            </button>

            {/* MICRO-MESSAGING SECTION */}
            <div className="mt-8 border-t-2 border-slate-100 pt-8">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  Discuss this Day
               </h3>
               <div className="bg-slate-50 rounded-2xl p-4 space-y-4 mb-4 max-h-48 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No messages for this day</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all mb-4">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900 mb-1">{msg.sender_name || 'Teacher'}</div>
                        <div className="text-sm text-amber-600 font-medium mb-2">{msg.content || msg.homework || msg.teacher_comment || 'No content'}</div>
                        <div className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
               </div>
               
               <div className="relative">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message to the teacher..."
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold focus:border-amber-500 outline-none pr-12 shadow-inner"
                  />
                  <button 
                    onClick={sendMessage}
                    className="absolute right-2 top-2 p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all"
                  >
                     <Send className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
