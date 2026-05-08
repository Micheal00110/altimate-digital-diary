import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, User, GraduationCap, Users, Loader2, MessageSquare, Bell, Send, Activity } from 'lucide-react';
import {
  getPendingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  ConnectionRequest
} from '../lib/connections';
import { useAuth } from '../hooks/useAuth';
import { supabase, ChildProfile } from '../lib/supabase';

interface ConnectionRequestsProps {
  onUpdate?: () => void;
}

export function ConnectionRequests({ onUpdate }: ConnectionRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const [students, setStudents] = useState<ChildProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

     const loadRequests = useCallback(async () => {
     if (!user) return;
     setIsLoading(true);
     setError('');
     const result = await getPendingRequests(user.id);
     if (result.success) {
       setRequests(result.data as ConnectionRequest[]);
     } else {
       setError(result.error || 'Failed to load requests');
     }
     setIsLoading(false);
   }, [user]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleAcceptClick = async (request: ConnectionRequest) => {
    if (user?.role === 'teacher' && request.from_user_type === 'parent' && !request.child_id) {
      setPendingAcceptId(request.id);
      loadStudents();
      setShowStudentModal(true);
      return;
    }
    await processAccept(request.id);
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data } = await supabase.from('child_profile').select('*').order('name');
      if (data) { setStudents(data); if (data.length > 0) setSelectedStudentId(String(data[0].id)); }
    } catch (err) { console.error('Failed to load students', err); }
    setLoadingStudents(false);
  };

  const processAccept = async (requestId: string, childId?: string) => {
    setProcessingId(requestId);
    const result = await acceptConnectionRequest(requestId, childId);
    if (result.success) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      onUpdate?.();
      setShowStudentModal(false);
      setPendingAcceptId(null);
    } else { setError(result.error || 'Failed to accept request'); }
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    const result = await rejectConnectionRequest(requestId);
    if (result.success) { setRequests(prev => prev.filter(r => r.id !== requestId)); onUpdate?.(); }
    else setError(result.error || 'Failed to reject request');
    setProcessingId(null);
  };

  const handleCancel = async (requestId: string) => {
    setProcessingId(requestId);
    const result = await cancelConnectionRequest(requestId);
    if (result.success) { setRequests(prev => prev.filter(r => r.id !== requestId)); onUpdate?.(); }
    else setError(result.error || 'Failed to cancel request');
    setProcessingId(null);
  };

  const incomingRequests = requests.filter(r => r.to_user_id === user?.id);
  const outgoingRequests = requests.filter(r => r.from_user_id === user?.id);

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="text-gray-600 font-medium">Loading requests...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><Bell className="w-8 h-8 text-white" /></div>
              <div>
                <h1 className="text-2xl font-bold text-white">Connection Requests</h1>
                <p className="text-blue-100">{requests.length} pending {requests.length === 1 ? 'request' : 'requests'}</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2"><span className="text-white font-semibold">{requests.length}</span></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><Activity className="w-4 h-4" /></div>
            <span className="flex-1">{error}</span>
            <button onClick={loadRequests} className="text-sm font-semibold underline hover:no-underline">Retry</button>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Send className="w-4 h-4 text-amber-600" /></div>
            Incoming Requests ({incomingRequests.length})
          </h3>
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-gray-400" /></div>
              <p className="text-gray-500">No incoming connection requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center"><User className="w-6 h-6 text-amber-600" /></div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{request.from_user?.name || 'Unknown User'}</h4>
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${request.from_user_type === 'teacher' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                              {request.from_user_type === 'teacher' ? <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Teacher</span> : 'Parent'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{request.from_user?.email}</p>
                        {request.child && <p className="text-sm text-amber-700 font-medium flex items-center gap-1.5 mb-2"><div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center"><User className="w-3 h-3 text-amber-600" /></div>For child: {request.child.name} ({request.child.grade})</p>}
                        {request.message && <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="text-sm text-gray-700 flex items-start gap-2"><MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />{request.message}</p></div>}
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Sent {new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {processingId === request.id ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : (
                          <>
                            <button onClick={() => handleAcceptClick(request)} className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold text-sm transition-all shadow-lg"><CheckCircle className="w-4 h-4" /> Accept</button>
                            <button onClick={() => handleReject(request.id)} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-semibold text-sm transition-all border border-red-100"><XCircle className="w-4 h-4" /> Decline</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Activity className="w-4 h-4 text-blue-600" /></div>
            Sent Requests ({outgoingRequests.length})
          </h3>
          {outgoingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Send className="w-8 h-8 text-gray-400" /></div>
              <p className="text-gray-500">No pending sent requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center"><GraduationCap className="w-6 h-6 text-blue-600" /></div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{request.to_user?.name || 'Unknown User'}</h4>
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${request.to_user_type === 'teacher' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                              {request.to_user_type === 'teacher' ? <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Teacher</span> : 'Parent'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{request.to_user?.email}</p>
                        {request.child && <p className="text-sm text-amber-700 font-medium flex items-center gap-1.5 mb-2"><div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center"><User className="w-3 h-3 text-amber-600" /></div>For child: {request.child.name} ({request.child.grade})</p>}
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Sent {new Date(request.created_at).toLocaleDateString()} • Waiting for response</p>
                      </div>
                      {processingId === request.id ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : (
                        <button onClick={() => handleCancel(request.id)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm transition-all"><XCircle className="w-4 h-4" /> Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showStudentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Select Student</h3>
              <p className="text-gray-500 mb-6 text-sm">Select the student this parent is requesting to connect with.</p>
              {loadingStudents ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
              ) : students.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-sm mb-4">You haven't added any students yet. Go to Class List and add a student first.</div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
                  <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 text-gray-900">
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.grade ? `(${s.grade})` : ''}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowStudentModal(false); setPendingAcceptId(null); }} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold transition-colors">Cancel</button>
                <button onClick={() => pendingAcceptId && processAccept(pendingAcceptId, selectedStudentId)} disabled={processingId !== null || students.length === 0 || !selectedStudentId} className="flex-1 px-4 py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {processingId ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Confirm</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
