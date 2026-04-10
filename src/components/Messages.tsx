import { useState, useEffect, useCallback } from 'react';
import { supabase, Message } from '../lib/supabase';
import { MessageCircle, Send, User, GraduationCap, ArrowLeft } from 'lucide-react';

interface MessagesProps {
  onBack: () => void;
}

export function Messages({ onBack }: MessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_type: 'parent',
          sender_name: 'Parent',
          content: newMessage.trim()
        }]);

      if (error) throw error;
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = useCallback(async () => {
    const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'teacher');
    if (unreadMessages.length === 0) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadMessages.map(m => m.id));

      if (error) throw error;
      setMessages(messages.map(m =>
        unreadMessages.some(um => um.id === m.id) ? { ...m, is_read: true } : m
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [messages]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl border-2 border-blue-200 overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={onBack} className="hover:bg-blue-700 p-2 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <MessageCircle className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Messages</h1>
              </div>
            </div>
            <p className="text-blue-100 mt-2">Communicate with your child's teacher</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400">Start a conversation with your child's teacher</p>
            </div>
          ) : (
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message, index) => {
                const showDate = index === 0 ||
                  new Date(message.created_at).toDateString() !==
                  new Date(messages[index - 1].created_at).toDateString();

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-400 my-4">
                        {formatDate(message.created_at)}
                      </div>
                    )}
                    <div className={`flex ${message.sender_type === 'parent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[80%] ${
                        message.sender_type === 'parent' ? 'flex-row-reverse' : ''
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender_type === 'parent'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {message.sender_type === 'parent'
                            ? <User className="w-4 h-4" />
                            : <GraduationCap className="w-4 h-4" />
                          }
                        </div>
                        <div className={`px-4 py-2 rounded-2xl ${
                          message.sender_type === 'parent'
                            ? 'bg-green-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_type === 'parent' ? 'text-green-100' : 'text-gray-400'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}