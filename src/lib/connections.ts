import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface TeacherProfile {
  id: string;
  user_id: string;
  qualification?: string;
  school_name: string;
  class_grade: string;
  subject_specialization?: string;
  years_of_experience?: number;
  bio?: string;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  phone_number?: string;
  created_at: string;
  // Joined from users table
  user?: { name: string; email: string };
}

export interface ParentProfile {
  id: string;
  user_id: string;
  relationship_to_child?: 'mother' | 'father' | 'guardian';
  occupation?: string;
  phone_number?: string;
  emergency_contact?: string;
}

export interface ConnectionRequest {
  id: string;
  from_user_id: string;
  from_user_type: 'teacher' | 'parent';
  to_user_id: string;
  to_user_type: 'teacher' | 'parent';
  child_id?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at?: string;
  // Joined data
  from_user?: { name: string; email: string };
  to_user?: { name: string; email: string };
  child?: { name: string; grade: string };
}

export interface ChildEnrollment {
  id: string;
  child_id: string;
  teacher_id: string;
  parent_id: string;
  class_year: string;
  enrolled_date: string;
  status: 'active' | 'inactive' | 'archived';
  // Joined data
  child?: { name: string; grade: string; school: string };
  teacher?: { name: string; email: string; school_name?: string };
  parent?: { name: string; email: string; relationship_to_child?: string };
  // Extended profile data
  teacher_profile?: { school_name: string; class_grade?: string; qualification?: string; teacher?: { name: string; email?: string } };
  parent_profile?: { relationship_to_child?: string; phone_number?: string; parent?: { name: string; email?: string } };
}

export interface ConnectionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// TEACHER DISCOVERY
// ============================================

export async function searchTeachersBySchool(schoolName: string): Promise<ConnectionResult> {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        user:user_id (email, raw_user_meta_data->name)
      `)
      .ilike('school_name', `%${schoolName}%`)
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('school_name');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Search teachers by school error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
  }
}

export async function searchTeachersByGrade(grade: string): Promise<ConnectionResult> {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        user:user_id (email, raw_user_meta_data->name)
      `)
      .ilike('class_grade', `%${grade}%`)
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('school_name');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Search teachers by grade error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
  }
}

export async function searchTeachersByName(name: string): Promise<ConnectionResult> {
  try {
    // Search in user metadata name
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, raw_user_meta_data->name')
      .ilike('raw_user_meta_data->>name', `%${name}%`)
      .limit(20);

    if (userError) throw userError;

    if (!users || users.length === 0) {
      return { success: true, data: [] };
    }

    const userIds = users.map((u: { id: string }) => u.id);

    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        user:user_id (email, raw_user_meta_data->name)
      `)
      .in('user_id', userIds)
      .eq('is_active', true)
      .eq('verification_status', 'verified');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Search teachers by name error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
  }
}

export async function getTeacherProfile(teacherId: string): Promise<ConnectionResult> {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        user:user_id (email, raw_user_meta_data->name)
      `)
      .eq('user_id', teacherId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Get teacher profile error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load profile' };
  }
}

// ============================================
// CONNECTION REQUESTS
// ============================================

export async function sendConnectionRequest(
  toUserId: string,
  toUserType: 'teacher' | 'parent',
  fromUserType: 'teacher' | 'parent',
  childId?: string,
  message?: string
): Promise<ConnectionResult> {
  try {
    const { data, error } = await supabase
      .from('connection_requests')
      .insert({
        to_user_id: toUserId,
        to_user_type: toUserType,
        from_user_type: fromUserType,
        child_id: childId,
        message: message
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Send connection request error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send request' };
  }
}

export async function getPendingRequests(userId: string): Promise<ConnectionResult> {
  try {
    // Skip for guest users
    if (!userId || userId.startsWith('guest-')) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        *,
        from_user:users!from_user_id (email, raw_user_meta_data->name),
        to_user:users!to_user_id (email, raw_user_meta_data->name),
        child:child_profiles!child_id (name, grade)
      `)
      .or(`to_user_id.eq.${userId},from_user_id.eq.${userId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Get pending requests error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load requests' };
  }
}

export async function acceptConnectionRequest(requestId: string, childId?: string): Promise<ConnectionResult> {
  try {
    // If a childId is provided (e.g. by the teacher when accepting), update the request first
    if (childId) {
      const { error: updateReqError } = await supabase
        .from('connection_requests')
        .update({ child_id: childId })
        .eq('id', requestId);
        
      if (updateReqError) throw updateReqError;
    }

    // Use the stored function to accept and create enrollment
    const { error } = await supabase
      .rpc('accept_connection_request', { request_id: requestId });

    if (error) {
      // Fallback: manual accept if RPC not available
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error('[Connections] Accept request error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to accept request' };
  }
}

export async function rejectConnectionRequest(requestId: string): Promise<ConnectionResult> {
  try {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Connections] Reject request error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reject request' };
  }
}

export async function cancelConnectionRequest(requestId: string): Promise<ConnectionResult> {
  try {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Connections] Cancel request error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel request' };
  }
}

// ============================================
// MY CONNECTIONS
// ============================================

export async function getMyConnections(userId: string, userType: 'teacher' | 'parent'): Promise<ConnectionResult> {
  try {
    // Skip for guest users
    if (!userId || userId.startsWith('guest-')) {
      return { success: true, data: [] };
    }

    let query;
    
    if (userType === 'teacher') {
      // In teacher view, we need to join parent profiles to get the parent user info
      query = supabase
        .from('child_enrollments')
        .select(`
          *,
          child:child_profiles!child_id (name, grade, school),
          parent_profile:parent_profiles!parent_id (
            relationship_to_child, 
            phone_number,
            parent:users!user_id (email, raw_user_meta_data->name)
          )
        `)
        .eq('teacher_id', userId)
        .eq('status', 'active');
    } else {
      // In parent view, we need to join teacher profiles to get the teacher user info
      query = supabase
        .from('child_enrollments')
        .select(`
          *,
          child:child_profiles!child_id (name, grade, school),
          teacher_profile:teacher_profiles!teacher_id (
            school_name, 
            class_grade, 
            qualification,
            teacher:users!user_id (email, raw_user_meta_data->name)
          )
        `)
        .eq('parent_id', userId)
        .eq('status', 'active');
    }

    const { data, error } = await query.order('enrolled_date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Get my connections error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load connections' };
  }
}

export async function removeConnection(enrollmentId: string): Promise<ConnectionResult> {
  try {
    const { error } = await supabase
      .from('child_enrollments')
      .update({ status: 'archived' })
      .eq('id', enrollmentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Connections] Remove connection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove connection' };
  }
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

export async function createOrUpdateTeacherProfile(profile: Partial<TeacherProfile>): Promise<ConnectionResult> {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Update teacher profile error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
  }
}

export async function createOrUpdateParentProfile(profile: Partial<ParentProfile>): Promise<ConnectionResult> {
  try {
    const { data, error } = await supabase
      .from('parent_profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[Connections] Update parent profile error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
  }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToConnectionRequests(
  userId: string,
  onNewRequest: (request: ConnectionRequest) => void
) {
  return supabase
    .channel('connection_requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'connection_requests',
        filter: `to_user_id=eq.${userId}`
      },
       (payload: { new: ConnectionRequest }) => {
         onNewRequest(payload.new);
       }
    )
    .subscribe();
}

export function subscribeToRequestUpdates(
  userId: string,
  onUpdate: (request: ConnectionRequest) => void
) {
  return supabase
    .channel('connection_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'connection_requests',
        filter: `from_user_id=eq.${userId}`
      },
       (payload: { new: ConnectionRequest }) => {
         onUpdate(payload.new);
       }
    )
    .subscribe();
}
