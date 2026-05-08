import { useState, useEffect, useCallback } from 'react';
import { Users, GraduationCap, User, School, Calendar, XCircle, Loader2, MessageCircle, BookOpen, Phone, ChevronRight, Activity } from 'lucide-react';
import { getMyConnections, removeConnection, ChildEnrollment } from '../lib/connections';
import { useAuth } from '../hooks/useAuth';

export function MyConnections({ onMessageClick, onViewDiary }: { onMessageClick?: (connection: ChildEnrollment) => void; onViewDiary?: (childId: string) => void }) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ChildEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState<string | null>(null);

     const loadConnections = useCallback(async () => {
     if (!user) return;
     setIsLoading(true);
     setError('');
     const userType = user.profile?.user_type || 'parent';
     const result = await getMyConnections(user.id, userType as 'teacher' | 'parent');
     if (result.success) {
       setConnections(result.data as ChildEnrollment[]);
     } else {
       setError(result.error || 'Failed to load connections');
     }
     setIsLoading(false);
   }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleRemove = async (enrollmentId: string) => {
    setRemovingId(enrollmentId);
    const result = await removeConnection(enrollmentId);
    if (result.success) {
      setConnections(prev => prev.filter(c => c.id !== enrollmentId));
      setShowConfirmRemove(null);
    } else {
      setError(result.error || 'Failed to remove connection');
    }
    setRemovingId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <span className="text-gray-600 font-medium">Loading your connections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Connections</h1>
                <p className="text-amber-100">{connections.length} active {connections.length === 1 ? 'connection' : 'connections'}</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <span className="text-white font-semibold">{connections.length}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="flex-1">{error}</span>
            <button onClick={loadConnections} className="text-sm font-semibold underline hover:no-underline">Retry</button>
          </div>
        )}

        {connections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No active connections yet</p>
            <p className="text-gray-500 text-sm">Search for teachers or wait for connection requests to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection: ChildEnrollment) => {
              const isTeacher = user?.profile?.user_type === 'teacher';
              const otherPerson = isTeacher 
                ? connection.parent_profile?.parent 
                : connection.teacher_profile?.teacher;

              return (
                <div key={connection.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden group">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center shadow-sm">
                            <BookOpen className="w-7 h-7 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">{connection.child?.name || 'Unknown Child'}</h3>
                            <div className="flex items-center gap-2 text-amber-700 font-medium">
                              <span className="bg-amber-50 px-2 py-0.5 rounded-lg text-sm">{connection.child?.grade}</span>
                              <span className="text-gray-400">•</span>
                              <span>{connection.child?.school}</span>
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium border border-blue-100">
                          <Calendar className="w-3.5 h-3.5" />
                          School Year: {connection.class_year}
                        </span>

                        <div className="border-t border-gray-100 pt-4 mt-4">
                          {isTeacher ? (
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 flex items-center gap-2">{otherPerson?.name || 'Unknown Parent'}</p>
                                <p className="text-sm text-gray-500">{otherPerson?.email}</p>
                                {connection.parent_profile?.relationship_to_child && (
                                  <p className="text-sm text-green-700 font-medium capitalize mt-1">{connection.parent_profile.relationship_to_child}</p>
                                )}
                                {connection.parent_profile?.phone_number && (
                                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1"><Phone className="w-3.5 h-3.5" /> {connection.parent_profile.phone_number}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 flex items-center gap-2">{otherPerson?.name || 'Unknown Teacher'}</p>
                                <p className="text-sm text-gray-500">{otherPerson?.email}</p>
                                {connection.teacher_profile?.school_name && (
                                  <p className="text-sm text-blue-700 font-medium flex items-center gap-1 mt-1"><School className="w-3.5 h-3.5" /> {connection.teacher_profile.school_name}</p>
                                )}
                                {connection.teacher_profile?.class_grade && (
                                  <p className="text-sm text-gray-400">{connection.teacher_profile.class_grade}{connection.teacher_profile.qualification && ` • ${connection.teacher_profile.qualification}`}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {onMessageClick && (
                          <button onClick={() => onMessageClick(connection)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-semibold text-sm transition-all border border-blue-100">
                            <MessageCircle className="w-4 h-4" /> Message
                          </button>
                        )}
                        {onViewDiary && connection.child && (
                          <button onClick={() => onViewDiary(connection.child_id)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 font-semibold text-sm transition-all border border-amber-100">
                            <BookOpen className="w-4 h-4" /> View Diary <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        {showConfirmRemove === connection.id ? (
                          <div className="flex gap-1.5 bg-red-50 p-2 rounded-xl">
                            <button onClick={() => setShowConfirmRemove(null)} className="px-3 py-2 bg-white text-gray-700 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50">Cancel</button>
                            <button onClick={() => handleRemove(connection.id)} disabled={removingId === connection.id} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                              {removingId === connection.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Remove'}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setShowConfirmRemove(connection.id)} className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-all">
                            <XCircle className="w-4 h-4" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Connected since {new Date(connection.enrolled_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
