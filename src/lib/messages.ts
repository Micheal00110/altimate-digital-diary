import { supabase } from './supabase';

export interface Message {
  id: string;
  child_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sender_name: string;
  sender_type: 'parent' | 'teacher';
  is_read: boolean;
  created_at: string;
}

export async function sendMessage(
  childId: string,
  recipientId: string,
  content: string,
  senderName: string,
  senderType: 'parent' | 'teacher'
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert([{
      child_id: childId,
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      sender_name: senderName,
      sender_type: senderType
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMessages(childId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export function subscribeToMessages(childId: string, onMessage: (message: Message) => void) {
  return supabase
    .channel(`messages:${childId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `child_id=eq.${childId}`
      },
      (payload) => onMessage(payload.new as Message)
    )
    .subscribe();
}
