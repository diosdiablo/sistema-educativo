import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Send, MessageCircle, Check, CheckCheck, Search, Users, ArrowLeft, Smile, MessagesSquare, Zap, Bell } from 'lucide-react';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const AVATAR_COLORS = ['#1a73e8', '#188038', '#e37400', '#d93025', '#007b83', '#5f6368'];

const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

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
  const { currentUser, users, isOnline, setUsers, addNotification } = useStore();
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
            if (newOnes.length > 0) {
              newOnes.forEach(msg => {
                if (msg.receiverId === currentUser?.id) {
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
  const activeConvos = Object.keys(lastMessagePreview).length;
  const myMessageCount = currentUser ? messages.filter(m => m.senderId === currentUser.id || m.receiverId === currentUser.id).length : 0;

  const statCards = [
    { icon: Users, label: 'Docentes', value: contacts.length, tint: 'var(--nav-active-bg)', fg: 'var(--nav-active-fg)' },
    { icon: MessagesSquare, label: 'Conversaciones activas', value: activeConvos, tint: 'var(--surface-muted)', fg: 'var(--success-color)' },
    { icon: MessageCircle, label: 'Sin leer', value: totalUnread, tint: totalUnread > 0 ? 'var(--danger-tint-bg)' : 'var(--surface-muted)', fg: totalUnread > 0 ? 'var(--danger-tint-fg)' : 'var(--text-secondary)' },
    { icon: CheckCheck, label: 'Mensajes totales', value: myMessageCount, tint: 'var(--surface-muted)', fg: 'var(--text-secondary)' }
  ];

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
      {/* Barra de herramientas */}
      <div style={{
        background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Chat</h2>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {totalUnread > 0 ? `${totalUnread} mensaje${totalUnread > 1 ? 's' : ''} sin leer` : 'Comunícate con otros docentes'}
          </p>
        </div>
        {totalUnread > 0 && (
          <span style={{
            background: 'var(--accent-primary)', color: 'white', fontSize: '0.8rem', fontWeight: 600,
            padding: '0.3rem 0.85rem', borderRadius: '20px'
          }}>{totalUnread} nuevos</span>
        )}
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{
              background: 'var(--bg-color-surface)', borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: card.tint, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={20} color={card.fg} />
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>{card.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cuerpo: lista + panel lateral */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Lista de conversaciones */}
        <div style={{
          background: 'var(--bg-color-surface)', borderRadius: '16px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem 1rem 0.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'var(--surface-muted)', borderRadius: '24px', padding: '0.55rem 1.15rem',
              border: '1px solid var(--border-color)'
            }}>
              <Search size={18} color="var(--text-secondary)" />
              <input type="text" placeholder="Buscar en el chat..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', background: 'transparent', color: 'var(--text-primary)' }} />
            </div>
          </div>

          {filteredContacts.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'var(--surface-muted)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Users size={32} color="var(--text-secondary)" />
              </div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {searchTerm ? 'Sin resultados' : 'No hay otros docentes'}
              </div>
              <div style={{ fontSize: '0.85rem' }}>{searchTerm ? 'Intenta con otro nombre' : 'Cuando haya docentes registrados aparecerán aquí'}</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '0.25rem 1.5rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Mensajes directos</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{filteredContacts.length}</span>
              </div>
              <div style={{ maxHeight: 'calc(100dvh - 560px)', minHeight: '240px', overflowY: 'auto', padding: '0 0.5rem 0.5rem' }}>
                {filteredContacts.map(contact => {
                  const preview = lastMessagePreview[contact.id];
                  const unread = unreadCount[contact.id] || 0;
                  return (
                    <div key={contact.id} onClick={() => onSelect(contact.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                        padding: '0.7rem 0.9rem', cursor: 'pointer', transition: 'background 0.15s',
                        borderRadius: '14px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{
                        position: 'relative', flexShrink: 0
                      }}>
                        <div style={{
                          width: '46px', height: '46px', borderRadius: '50%',
                          background: getAvatarColor(contact.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 500, fontSize: '1.15rem'
                        }}>{contact.name?.charAt(0)?.toUpperCase() || '?'}</div>
                        {unread > 0 && (
                          <div style={{
                            position: 'absolute', top: '-4px', right: '-6px',
                            minWidth: '20px', height: '20px', borderRadius: '10px', padding: '0 6px',
                            background: 'var(--accent-primary)', color: 'white', fontSize: '0.68rem',
                            fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid var(--bg-color-surface)'
                          }}>{unread > 9 ? '9+' : unread}</div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ fontSize: '0.92rem', fontWeight: unread > 0 ? 600 : 500, color: 'var(--text-primary)' }}>{contact.name}</strong>
                          {preview && <span style={{ fontSize: '0.7rem', color: unread > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{formatTime(new Date(preview.createdAt))}</span>}
                        </div>
                        <div style={{
                          fontSize: '0.82rem', color: unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                          marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          fontWeight: unread > 0 ? 500 : 400
                        }}>
                          {preview ? (
                            <>{preview.senderId === currentUser?.id && (preview.readAt ? <CheckCheck size={12} style={{ display: 'inline', marginRight: 4 }} /> : <Check size={12} style={{ display: 'inline', marginRight: 4 }} />)}{preview.message}</>
                          ) : (contact.role === 'admin' ? 'Administrador · Sin mensajes aún' : 'Docente · Sin mensajes aún')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Panel lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'var(--bg-color-surface)', borderRadius: '16px',
            border: '1px solid var(--border-color)', padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: isOnline ? '#18803815' : 'var(--surface-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Zap size={17} color={isOnline ? '#188038' : 'var(--text-secondary)'} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Estado del sistema</div>
                <div style={{ fontSize: '0.75rem', color: isOnline ? '#188038' : 'var(--text-secondary)', fontWeight: 500 }}>
                  {isOnline ? 'En línea · sincronizando' : 'Sin conexión · modo local'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Tus mensajes se guardan automáticamente y se envían en cuanto haya conexión.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-color-surface)', borderRadius: '16px',
            border: '1px solid var(--border-color)', padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'var(--nav-active-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bell size={17} color="var(--nav-active-fg)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Cómo funciona</div>
            </div>
            {[
              ['Enter', 'Envía el mensaje al instante'],
              ['Shift + Enter', 'Salto de línea sin enviar'],
              ['Notificaciones', 'Aviso automático de mensajes nuevos']
            ].map(([k, d]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-primary)',
                  background: 'var(--surface-muted)', border: '1px solid var(--border-color)',
                  padding: '0.15rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap'
                }}>{k}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-color-surface)', borderRadius: '16px',
            border: '1px solid var(--border-color)', padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: getAvatarColor(currentUser?.name),
                color: 'white', fontWeight: 500, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{currentUser?.name?.charAt(0)?.toUpperCase() || '?'}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{currentUser?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tú · {currentUser?.role === 'admin' ? 'Administrador' : 'Docente'}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Tu perfil es visible para los demás docentes en cada conversación.
            </p>
          </div>
        </div>
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
        try {
          supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
        } catch {}
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
    <div id="chat-conversation-root" style={{ flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <div style={{
        background: 'var(--bg-color-surface)', borderRadius: '16px',
        border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Encabezado de conversación */}
        <div style={{
          padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          flexShrink: 0
        }}>
          <button onClick={onBack} title="Volver"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={22} />
          </button>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
            background: getAvatarColor(contact?.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 500, fontSize: '1.05rem'
          }}>{contact?.name?.charAt(0)?.toUpperCase() || '?'}</div>
          <div>
            <strong style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>{contact?.name || 'Usuario'}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block',
                background: isOnline ? '#188038' : 'var(--text-secondary)'
              }} />
              {contact?.role === 'admin' ? 'Administrador' : 'Docente'}
            </div>
          </div>
        </div>

        {/* Mensajes */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem',
          background: 'var(--surface-muted)', minHeight: 0
        }}>
          {conversationMessages.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'var(--bg-color-surface)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MessageCircle size={32} color="var(--text-secondary)" />
              </div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Aún no hay mensajes</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Envía el primero para comenzar la conversación</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['¡Hola! 👋', 'Buenos días', '¿Cómo van los registros?'].map(quick => (
                  <button key={quick} onClick={() => setInputText(quick)}
                    style={{
                      padding: '0.45rem 1rem', borderRadius: '20px',
                      background: 'var(--bg-color-surface)', border: '1px solid var(--border-color)',
                      color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--nav-active-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-color-surface)'; }}
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            conversationMessages.map((msg, idx) => {
              const isMine = msg.senderId === currentUser?.id;
              const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(conversationMessages[idx - 1].createdAt).toDateString();
              const prevMsg = idx > 0 ? conversationMessages[idx - 1] : null;
              const timeGap = prevMsg ? (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) > 5 * 60 * 1000 : true;
              const groupStart = showDate || !prevMsg || prevMsg.senderId !== msg.senderId || timeGap;
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '1rem 0 0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-color-surface)', border: '1px solid var(--border-color)', padding: '0.3rem 0.9rem', borderRadius: '20px' }}>{formatDateSeparator(msg.createdAt)}</span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '8px',
                    marginBottom: groupStart ? '0.6rem' : '2px',
                    marginTop: showDate ? 0 : undefined
                  }}>
                    {!isMine && (
                      groupStart ? (
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                          background: getAvatarColor(contact?.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 500, fontSize: '0.72rem', alignSelf: 'flex-end'
                        }}>{(contact?.name || '?').charAt(0).toUpperCase()}</div>
                      ) : (
                        <div style={{ width: '28px', flexShrink: 0 }} />
                      )
                    )}
                    <div style={{ maxWidth: isMine ? '78%' : '70%' }}>
                      {!isMine && groupStart && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '3px', paddingLeft: '4px' }}>{msg.senderName || contact?.name}</div>
                      )}
                      <div style={{
                        padding: '0.55rem 0.95rem 0.45rem',
                        display: 'inline-block',
                        borderRadius: isMine ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                        background: isMine ? 'var(--accent-primary)' : 'var(--bg-color-surface)',
                        color: isMine ? 'white' : 'var(--text-primary)',
                        border: isMine ? 'none' : '1px solid var(--border-color)'
                      }}>
                        <div style={{ fontSize: '0.88rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', textAlign: 'left' }}>{msg.message}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.62rem', color: isMine ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)' }}>{formatTime(new Date(msg.createdAt))}</span>
                          {isMine && (msg.readAt ? <CheckCheck size={13} color="rgba(255,255,255,0.9)" /> : <Check size={13} color="rgba(255,255,255,0.55)" />)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Compositor */}
        <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '0.35rem',
            background: 'var(--surface-muted)', borderRadius: '26px', padding: '0.3rem 0.4rem 0.3rem 1.15rem',
            border: '1px solid var(--border-color)'
          }}>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Escribe un mensaje..." rows={1}
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                fontSize: '0.9rem', background: 'transparent', color: 'var(--text-primary)',
                fontFamily: 'inherit', maxHeight: '120px', padding: '0.45rem 0'
              }} />
            <button onClick={() => setInputText(prev => (prev || '') + '🙂')} title="Emoji"
              style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                border: 'none', cursor: 'pointer', background: 'transparent',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-color)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Smile size={20} />
            </button>
            <button onClick={sendMessage} disabled={!inputText.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
                background: inputText.trim() ? 'var(--accent-primary)' : 'transparent',
                color: inputText.trim() ? 'white' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
