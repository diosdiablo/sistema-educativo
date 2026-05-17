import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Send, MessageCircle, Check, CheckCheck, Search, Users, ArrowLeft } from 'lucide-react';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const loadMessages = () => {
  try {
    const saved = localStorage.getItem('edu_chat_messages');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export function ChatList() {
  console.log('ChatList rendered');
  const navigate = useNavigate();
  return <ChatContacts onSelect={(id) => navigate(`/chat/${id}`)} />;
}

export function ChatConversationPage() {
  console.log('ChatConversationPage rendered, params:', useParams());
  const { userId } = useParams();
  const navigate = useNavigate();

  return <ChatConversation key={userId} userId={userId} onBack={() => navigate('/chat')} />;
}

export default function Chat() {
  console.warn('Chat() default export should not be used directly; use ChatList or ChatConversationPage');
  const { userId } = useParams();
  const navigate = useNavigate();
  if (userId) return <ChatConversation userId={userId} onBack={() => navigate('/chat')} />;
  return <ChatContacts onSelect={(id) => navigate(`/chat/${id}`)} />;
}

function ChatContacts({ onSelect }) {
  const { currentUser, users, isOnline, setUsers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState(loadMessages);

  useEffect(() => {
    localStorage.setItem('edu_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!isOnline) return;
    const fetchNew = async () => {
      try {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`receiver_id.eq.${currentUser?.id},sender_id.eq.${currentUser?.id}`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (data?.length > 0) {
          const n = data.map(m => ({ id: m.id, senderId: m.sender_id, senderName: m.sender_name, receiverId: m.receiver_id, message: m.message, createdAt: m.created_at, readAt: m.read_at }));
          setMessages(prev => {
            const ids = new Set(prev.map(p => p.id));
            const newOnes = n.filter(x => !ids.has(x.id));
            return newOnes.length ? [...prev, ...newOnes] : prev;
          });
        }
      } catch {}
    };
    if (currentUser) fetchNew();
    const interval = setInterval(fetchNew, 5000);
    return () => clearInterval(interval);
  }, [isOnline, currentUser?.id]);

  useEffect(() => {
    if (isOnline && users.length <= 1) {
      supabase.from('users').select('*').then(({ data }) => { if (data?.length > users.length) setUsers(data); }).catch(() => {});
    }
  }, [isOnline]);

  const contacts = useMemo(() => {
    const currentId = currentUser?.id;
    const filtered = users.filter(u => {
      if (u.id === currentId) return false;
      const role = (u.role || '').toLowerCase();
      if (role === 'user') return false;
      return role === 'teacher' || role === 'admin' || u.username === 'admin';
    });
    return filtered.length === 0 && users.length > 1 && currentId
      ? users.filter(u => u.id !== currentId)
      : filtered;
  }, [users, currentUser]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    return contacts.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()));
  }, [contacts, searchTerm]);

  const lastMessagePreview = useMemo(() => {
    if (!currentUser) return {};
    const previews = {};
    contacts.forEach(c => {
      const conv = messages.filter(m =>
        (m.senderId === currentUser.id && m.receiverId === c.id) ||
        (m.senderId === c.id && m.receiverId === currentUser.id)
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (conv.length > 0) previews[c.id] = conv[0];
    });
    return previews;
  }, [messages, contacts, currentUser]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return {};
    const counts = {};
    messages.forEach(m => {
      if (m.receiverId === currentUser.id && !m.readAt) counts[m.senderId] = (counts[m.senderId] || 0) + 1;
    });
    return counts;
  }, [messages, currentUser]);

  const formatTime = (d) => {
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  const totalUnread = Object.values(unreadCount).reduce((a, b) => a + b, 0);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
        borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)'
          }}><MessageCircle size={28} /></div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Chat entre Docentes</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
              {totalUnread > 0 ? `${totalUnread} mensaje${totalUnread > 1 ? 's' : ''} sin leer` : 'Comunícate con otros docentes'}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f8fafc', borderRadius: '12px', padding: '0.5rem 1rem',
            border: '1px solid #e2e8f0'
          }}>
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Buscar docente..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.85rem', background: 'transparent', color: '#1e293b' }} />
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
            <div>{searchTerm ? 'Sin resultados' : 'No hay otros docentes'}</div>
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(100dvh - 450px)', overflowY: 'auto' }}>
            {filteredContacts.map(contact => {
              const preview = lastMessagePreview[contact.id];
              const unread = unreadCount[contact.id] || 0;
              return (
                <div key={contact.id} onClick={() => onSelect(contact.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.85rem 1rem', cursor: 'pointer', transition: 'background 0.15s',
                    borderBottom: '1px solid #f8fafc'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '1.1rem'
                  }}>{contact.name?.charAt(0)?.toUpperCase() || '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{contact.name}</strong>
                      {preview && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatTime(new Date(preview.createdAt))}</span>}
                    </div>
                    <div style={{
                      fontSize: '0.8rem', color: unread > 0 ? '#1e293b' : '#94a3b8',
                      marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontWeight: unread > 0 ? 600 : 400
                    }}>
                      {preview ? (
                        <>{preview.senderId === currentUser?.id && (preview.readAt ? <CheckCheck size={12} style={{ display: 'inline', marginRight: 4 }} /> : <Check size={12} style={{ display: 'inline', marginRight: 4 }} />)}{preview.message}</>
                      ) : 'Sin mensajes'}
                    </div>
                  </div>
                  {unread > 0 && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: '#6366f1', color: 'white', fontSize: '0.7rem',
                      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>{unread > 9 ? '9+' : unread}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatConversation({ userId, onBack }) {
  const { currentUser, isOnline, users, addNotification, markNotificationRead, notifications } = useStore();
  const { addToast } = useToast();
  const [messages, setMessages] = useState(loadMessages);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());

  console.log('ChatConversation mounted, userId:', userId, 'currentUser:', currentUser?.id, 'messages:', messages.length, 'notifications:', notifications?.length);
  const contact = useMemo(() => users.find(u => u.id === userId), [users, userId]);

  const conversationMessages = useMemo(() => {
    if (!userId || !currentUser) return [];
    return messages.filter(m =>
      (m.senderId === currentUser.id && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === currentUser.id)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, userId, currentUser]);

  useEffect(() => {
    localStorage.setItem('edu_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!userId || !currentUser) return;
    const unreadIds = messages.filter(m =>
      m.senderId === userId && m.receiverId === currentUser.id && !m.readAt
    ).map(m => m.id);
    if (unreadIds.length > 0) {
      setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, readAt: new Date().toISOString() } : m));
      if (isOnline) {
        supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds).catch(() => {});
      }
    }
    try {
      const contactName = contact?.name || '';
      if (contactName) {
        notifications.forEach(n => {
          if (n.title?.includes(contactName) && n.readBy && !n.readBy.includes(currentUser.id)) markNotificationRead(n.id);
        });
      }
    } catch {} // eslint-disable-line no-empty
  }, [userId, currentUser]);

  useEffect(() => {
    if (!isOnline || !currentUser) return;
    const fetchNew = async () => {
      try {
        const since = messages.length > 0
          ? new Date(new Date(Math.max(...messages.filter(m => m.senderId !== currentUser.id).map(m => new Date(m.createdAt).getTime()))).getTime() - 1000).toISOString()
          : new Date(0).toISOString();
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`receiver_id.eq.${currentUser.id},sender_id.eq.${currentUser.id}`)
          .gte('created_at', since)
          .order('created_at', { ascending: false });
        if (data?.length > 0) {
          const normalized = data.map(m => ({ id: m.id, senderId: m.sender_id, senderName: m.sender_name, receiverId: m.receiver_id, message: m.message, createdAt: m.created_at, readAt: m.read_at }));
          setMessages(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = normalized.filter(n => !existingIds.has(n.id));
            if (newOnes.length > 0) {
              newOnes.forEach(msg => {
                if (msg.receiverId === currentUser.id && !notifiedIdsRef.current.has(msg.id)) {
                  notifiedIdsRef.current.add(msg.id);
                  const sender = users.find(u => u.id === msg.senderId);
                  addNotification(`Nuevo mensaje de ${sender?.name || msg.senderName}`, msg.message.length > 80 ? msg.message.slice(0, 80) + '...' : msg.message, 'chat_message');
                }
              });
              return [...prev, ...newOnes];
            }
            return prev;
          });
        }
      } catch {}
    };
    fetchNew();
    pollingRef.current = setInterval(fetchNew, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [isOnline, currentUser?.id, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !userId || !currentUser) return;
    const msg = {
      id: generateId(), senderId: currentUser.id, senderName: currentUser.name,
      receiverId: userId, message: inputText.trim(),
      createdAt: new Date().toISOString(), readAt: null
    };
    setInputText('');
    setMessages(prev => [...prev, msg]);
    if (isOnline) {
      try {
        await supabase.from('chat_messages').upsert({
          id: msg.id, sender_id: msg.senderId, sender_name: msg.senderName,
          receiver_id: msg.receiverId, message: msg.message,
          created_at: msg.createdAt, read_at: msg.readAt
        }, { onConflict: 'id' });
        const receiver = users.find(u => u.id === userId);
        if (receiver) {
          fetch('/api/notify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `📩 ${currentUser.name}`,
              message: msg.message.length > 100 ? msg.message.slice(0, 100) + '...' : msg.message,
              url: '/chat', userId
            })
          }).catch(() => {});
        }
      } catch {
        addToast('Error al enviar mensaje', 'error');
      }
    }
  };

  const formatTime = (d) => {
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hoy';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div id="chat-conversation-root" style={{
      flex: 1, minHeight: '50dvh', display: 'flex', flexDirection: 'column',
      maxWidth: '900px', margin: '0 auto', width: '100%'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0
      }}>
        <div style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#fafbfc', flexShrink: 0
        }}>
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6366f1' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1rem'
          }}>{contact?.name?.charAt(0)?.toUpperCase() || '?'}</div>
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{contact?.name || 'Usuario'}</strong>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{contact?.role === 'admin' ? 'Administrador' : 'Docente'}</div>
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.25rem',
          background: '#f8fafc', minHeight: 0
        }}>
          {conversationMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', paddingTop: '3rem' }}>
              No hay mensajes aún. ¡Envía el primero!
            </div>
          ) : (
            conversationMessages.map((msg, idx) => {
              const isMine = msg.senderId === currentUser?.id;
              const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(conversationMessages[idx - 1].createdAt).toDateString();
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '1rem 0 0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>{formatDateSeparator(msg.createdAt)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{
                      maxWidth: '80%', padding: '0.65rem 1rem',
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMine ? '#6366f1' : 'white',
                      color: isMine ? 'white' : '#1e293b',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{formatTime(new Date(msg.createdAt))}</span>
                        {isMine && (msg.readAt ? <CheckCheck size={12} color="#a5b4fc" /> : <Check size={12} color="rgba(255,255,255,0.5)" />)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', background: 'white', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '0.75rem',
            background: '#f8fafc', borderRadius: '14px', padding: '0.5rem 1rem',
            border: '1px solid #e2e8f0'
          }}>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Escribe un mensaje..." rows={1}
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                fontSize: '0.88rem', background: 'transparent', color: '#1e293b',
                fontFamily: 'inherit', maxHeight: '120px', padding: '0.25rem 0'
              }} />
            <button onClick={sendMessage} disabled={!inputText.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                border: 'none', cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                background: inputText.trim() ? '#6366f1' : '#e2e8f0',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
