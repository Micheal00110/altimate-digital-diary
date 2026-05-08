import { useState } from 'react';
import { Search, School, GraduationCap, User, Send, CheckCircle, X, Loader2, Building2 } from 'lucide-react';
import { 
  searchTeachersBySchool, 
  searchTeachersByGrade, 
  searchTeachersByName,
  sendConnectionRequest,
  TeacherProfile 
} from '../lib/connections';
import { useAuth } from '../hooks/useAuth';

interface TeacherSearchProps {
  onClose?: () => void;
  selectedChildId?: string;
}

export function TeacherSearch({ onClose, selectedChildId }: TeacherSearchProps) {
  const { user } = useAuth();
  const [searchType, setSearchType] = useState<'school' | 'grade' | 'name'>('school');
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    let result;
    switch (searchType) {
      case 'school':
        result = await searchTeachersBySchool(searchQuery);
        break;
      case 'grade':
        result = await searchTeachersByGrade(searchQuery);
        break;
      case 'name':
        result = await searchTeachersByName(searchQuery);
        break;
    }
    
      if (result.success) {
        const teachersArray = result.data as TeacherProfile[];
        setTeachers(teachersArray);
      } else {
        setError(result.error || 'Search failed');
      }
    
    setIsLoading(false);
  };

  const handleSendRequest = async () => {
    if (!selectedTeacher || !user) return;
    
    setIsLoading(true);
    
    const result = await sendConnectionRequest(
      selectedTeacher.user_id,
      'teacher',
      'parent',
      selectedChildId,
      requestMessage
    );
    
    if (result.success) {
      setSentRequests(prev => new Set(prev).add(selectedTeacher.user_id));
      setShowRequestModal(false);
      setRequestMessage('');
      setSelectedTeacher(null);
    } else {
      setError(result.error || 'Failed to send request');
    }
    
    setIsLoading(false);
  };

  const openRequestModal = (teacher: TeacherProfile) => {
    setSelectedTeacher(teacher);
    setRequestMessage(`Hi! I'm interested in connecting with you about my child.`);
    setShowRequestModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Find Your Child's Teacher</h2>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Type Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'school', label: 'By School', icon: Building2 },
          { id: 'grade', label: 'By Grade', icon: GraduationCap },
          { id: 'name', label: 'By Name', icon: User }
         ].map(({ id, label, icon: Icon }) => (
           <button
             key={id}
             onClick={() => { setSearchType(id as 'school' | 'grade' | 'name'); setTeachers([]); }}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              searchType === id 
                ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' 
                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={
              searchType === 'school' ? "Enter school name (e.g., 'Springfield Elementary')" :
              searchType === 'grade' ? "Enter grade (e.g., 'Grade 3', 'Kindergarten')" :
              "Enter teacher's name"
            }
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || !searchQuery.trim()}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Results */}
      {teachers.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{teachers.length} teacher(s) found</p>
          
          {teachers.map((teacher: TeacherProfile) => (
            <div key={teacher.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {teacher.user?.name || 'Unknown Teacher'}
                    </h3>
                    {teacher.verification_status === 'verified' && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  
                  <p className="text-amber-700 font-medium">{teacher.school_name}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded">{teacher.class_grade}</span>
                    {teacher.qualification && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{teacher.qualification}</span>
                    )}
                    {teacher.years_of_experience && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{teacher.years_of_experience} years exp</span>
                    )}
                  </div>
                  
                  {teacher.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{teacher.bio}</p>
                  )}
                </div>
                
                <button
                  onClick={() => openRequestModal(teacher)}
                  disabled={sentRequests.has(teacher.user_id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    sentRequests.has(teacher.user_id)
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {sentRequests.has(teacher.user_id) ? (
                    <><CheckCircle className="w-4 h-4" /> Request Sent</>
                  ) : (
                    <><Send className="w-4 h-4" /> Connect</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {teachers.length === 0 && !isLoading && searchQuery && !error && (
        <div className="text-center py-8 text-gray-500">
          <School className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No teachers found. Try a different search term.</p>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Send Connection Request</h3>
            <p className="text-gray-600 mb-4">
              To: <span className="font-medium text-gray-900">{selectedTeacher.user?.name}</span>
              <br />
              <span className="text-sm">{selectedTeacher.school_name} - {selectedTeacher.class_grade}</span>
            </p>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optional Message
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
              placeholder="Introduce yourself..."
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
