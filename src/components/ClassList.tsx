import { useState, useEffect, FormEvent, useCallback } from 'react';
import { supabase, ChildProfile } from '../lib/supabase';
import {
  Users, UserPlus, X, Save, ChevronRight,
  Loader2, Search, CheckCircle2, UserCircle, Upload, Image
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ClassListProps {
  onSelectStudent: (student: ChildProfile) => void;
  selectedDate: string;
}

export function ClassList({ onSelectStudent, selectedDate }: ClassListProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<ChildProfile[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [signedStatuses, setSignedStatuses] = useState<Record<string, boolean>>({});

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

   const loadData = useCallback(async () => {
     setLoading(true);
     try {
       const { data: studentsData } = await supabase.from('child_profile').select('*');
       if (studentsData) {
         setStudents(studentsData as ChildProfile[]);
         const grades = Array.from(new Set(studentsData
           .filter((s): s is ChildProfile => !!s.grade)
           .map((s) => s.grade)
         ));
         setAvailableGrades(grades);
       }

       const { data: entriesData } = await supabase
         .from('diary_entries')
         .select('child_id, signed')
         .eq('date', selectedDate);

       if (entriesData) {
         const statuses: Record<string, boolean> = {};
         entriesData.forEach((entry) => { statuses[entry.child_id] = entry.signed; });
         setSignedStatuses(statuses);
       }
     } catch (err) { console.error('Error fetching students:', err); }
     setLoading(false);
   }, [selectedDate]);

   useEffect(() => { loadData(); }, [loadData]);

const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const schoolId = user?.school_id || (user?.profile as { school_id?: string })?.school_id;
      
      let finalPhotoUrl = photoUrl.trim() || null;
      
      if (photoFile) {
        setIsUploading(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `student-photos/${schoolId || 'public'}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, photoFile, { upsert: true });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
          finalPhotoUrl = publicUrl;
        }
        setIsUploading(false);
      }
      
      const { error } = await supabase.from('child_profile').insert([
        { 
          name: name.trim(), 
          grade: grade.trim(), 
          school: school.trim(), 
          school_id: schoolId,
          photo_url: finalPhotoUrl
        }
      ]);
      if (error) throw error;
      setName(''); setGrade(''); setSchool(''); setPhotoUrl(''); setPhotoFile(null); setPhotoPreview(null); setIsAdding(false);
      loadData();
    } catch (err) { console.error('Error adding student:', err); }
    setSaving(false);
  };

  const filteredStudents = students.filter(s => 
    (selectedGrade === 'all' || s.grade === selectedGrade) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.grade && s.grade.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoUrl('');
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading && !isAdding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50/50">
        <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse text-[10px] uppercase font-black tracking-widest">Syncing class records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Class Management</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
              <Users className="w-3 h-3 text-amber-500" />
              {students.length} Enrolled Students
            </p>
          </div>
          
          {availableGrades.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
              <button 
                onClick={() => setSelectedGrade('all')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedGrade === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >All</button>
              {availableGrades.map(g => (
                <button 
                  key={g} onClick={() => setSelectedGrade(g)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedGrade === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >{g}</button>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-3">
             <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                <input 
                  type="text" placeholder="Quick search..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                />
             </div>
             <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-200">
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Enroll Student</span>
             </button>
        </div>
      </div>

        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 p-2.5 rounded-2xl"><UserPlus className="w-6 h-6 text-amber-600" /></div>
                    <h2 className="text-2xl font-bold text-slate-900">New Enrollment</h2>
                  </div>
                  <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleAddStudent} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none" placeholder="e.g. Alexander Hamilton" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Grade</label>
                      <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none" placeholder="Grade 1" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Campus</label>
                      <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none" placeholder="East Wing" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Student Photo (Optional)</label>
                     <div className="grid grid-cols-2 gap-3">
                       <label className="cursor-pointer flex items-center justify-center gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-amber-400 hover:bg-amber-50/30 transition-all group">
                         <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                         <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
                         <span className="text-xs font-bold text-slate-500 group-hover:text-amber-600">Upload Photo</span>
                       </label>
                       <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                         {photoPreview ? (
                           <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                         ) : photoUrl ? (
                           <img src={photoUrl} alt="Existing" className="w-full h-full object-cover" />
                         ) : (
                           <div className="flex items-center gap-2 text-slate-300 p-4">
                             <Image className="w-5 h-5" />
                             <span className="text-[10px]">No image</span>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
<button type="submit" disabled={saving || isUploading || !name.trim()} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-200 disabled:opacity-50">
                     {(saving || isUploading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     {isUploading ? 'Uploading...' : 'Confirm Enrollment'}
                   </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center shadow-sm">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No students matched</h2>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">Try a different search term or enroll a new student.</p>
            <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-2 text-amber-600 font-bold hover:bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 transition-all">
              <UserPlus className="w-5 h-5" /> Enroll Student
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 text-left shadow-sm hover:shadow-2xl hover:border-amber-200 transition-all relative overflow-hidden"
              >
                 <div className="flex items-center gap-5 mb-6 relative z-10">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border-2 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                     {student.photo_url ? (
                       <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                     ) : (
                       <UserCircle className="w-8 h-8" />
                     )}
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors leading-tight mb-1">{student.name}</h3>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">{student.grade || 'Unassigned'}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">{student.school || 'Main Campus'}</span>
                     </div>
                   </div>
                 </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${signedStatuses[student.id] ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${signedStatuses[student.id] ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {signedStatuses[student.id] ? 'Daily Log Signed' : 'Pending Signature'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
