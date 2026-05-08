import { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { sendMessage, getMessages, subscribeToMessages, Message } from '../lib/messages';
import { useAuth } from '../hooks/useAuth';

interface MessagingProps {
  childId: string;
  recipientId: string;
  childName: string;
  onClose?: () => void;
}

export function Messaging({ childId, recipientId, childName, onClose }: MessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await getMessages(childId);
        setMessages(data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    const subscription = subscribeToMessages(childId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [childId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(
        childId,
        recipientId,
        content,
        (user.profile as any)?.name || user.email || 'User',
        user.role === 'teacher' ? 'teacher' : 'parent'
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 p-2.5 rounded-2xl">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight leading-none">{childName} Chat</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Secure Line</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <MessageCircle className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No messages yet</p>
            <p className="text-slate-500 text-xs font-medium mt-1">Start the conversation about {childName}.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-5 py-3.5 rounded-[1.8rem] text-sm font-medium shadow-sm ${
                    isMe 
                      ? 'bg-amber-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                  }`}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-3">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-4 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all shadow-xl shadow-amber-200 disabled:opacity-50 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
