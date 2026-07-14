import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

function ChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [chats, setChats] = useState([]); // List of active chat contact usernames
  const [minimized, setMin] = useState([]); // List of minimized contact usernames
  const [msgs, setMsgs] = useState({}); // Messages grouped by contact username: { username: [msgObj, ...] }
  const [unread, setUnread] = useState({}); // Unread counts: { username: count }
  const [inputs, setInputs] = useState({}); // Inputs per active chat: { username: text }
  const endRefs = useRef({});

  // Cargar lista de usuarios
  useEffect(() => {
    if (!user) return;
    async function loadContacts() {
      try {
        const list = await api.getUsers();
        // Filtrar a uno mismo
        const others = list.filter(u => u.username.toLowerCase() !== user.toLowerCase());
        setContacts(others);
      } catch (err) {
        console.error(err);
      }
    }
    loadContacts();
  }, [user]);

  // Cargar y sincronizar mensajes del backend periódicamente
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function syncMessages() {
      try {
        const allMsgs = await api.getMessages(user);
        
        // Agrupar mensajes por contacto
        const grouped = {};
        allMsgs.forEach(m => {
          const chatPartner = m.senderId === user ? m.receiverId : m.senderId;
          if (!grouped[chatPartner]) grouped[chatPartner] = [];
          grouped[chatPartner].push(m);
        });

        if (isMounted) {
          setMsgs(grouped);
        }
      } catch (err) {
        console.error('Error sincronizando mensajes en ChatWidget:', err);
      }
    }

    syncMessages();
    const interval = setInterval(syncMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Hacer scroll al recibir nuevos mensajes
  useEffect(() => {
    chats.forEach(username => {
      if (!minimized.includes(username)) {
        endRefs.current[username]?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [msgs, chats, minimized]);

  const openChat = (username) => {
    if (!chats.includes(username)) {
      setChats(prev => [...prev, username]);
    }
    setMin(prev => prev.filter(x => x !== username));
    setUnread(prev => ({ ...prev, [username]: 0 }));
  };

  const closeChat = (username, e) => {
    e.stopPropagation();
    setChats(prev => prev.filter(x => x !== username));
    setMin(prev => prev.filter(x => x !== username));
  };

  const toggleMin = (username, e) => {
    e.stopPropagation();
    if (minimized.includes(username)) {
      setMin(prev => prev.filter(x => x !== username));
      setUnread(prev => ({ ...prev, [username]: 0 }));
    } else {
      setMin(prev => [...prev, username]);
    }
  };

  const sendMsg = async (username, e) => {
    e.preventDefault();
    const text = (inputs[username] || '').trim();
    if (!text) return;

    // Limpiar input de inmediato
    setInputs(prev => ({ ...prev, [username]: '' }));

    // Crear mensaje optimista localmente
    const optMsg = {
      id: Date.now(),
      senderId: user,
      receiverId: username,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      optimistic: true
    };

    setMsgs(prev => ({
      ...prev,
      [username]: [...(prev[username] || []), optMsg]
    }));

    try {
      const res = await api.sendMessage(user, username, text);
      // Reemplazar con el mensaje real persistido
      setMsgs(prev => ({
        ...prev,
        [username]: (prev[username] || []).map(m => m.optimistic && m.text === text ? res.message : m)
      }));
    } catch (err) {
      console.error(err);
      alert('No se pudo enviar el mensaje.');
      setMsgs(prev => ({
        ...prev,
        [username]: (prev[username] || []).filter(m => !m.optimistic)
      }));
    }
  };

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <div className="chat-widget-container">
      {/* Ventanas de chat abiertas flotantes */}
      <div className="chat-windows-dock">
        {chats.map(username => {
          const c = contacts.find(x => x.username === username);
          if (!c) return null;
          const isMin = minimized.includes(username);
          const chatHistory = msgs[username] || [];

          return (
            <div key={username} className={`chat-window ${isMin ? 'minimized' : ''}`}>
              <div className="chat-window-header" onClick={e => toggleMin(username, e)}>
                <div className="chat-window-user">
                  <div className="chat-window-avatar" style={{ background: c.avatar?.length === 1 ? '#2563eb' : 'transparent' }}>
                    {c.avatar?.length === 1 ? c.avatar : <img src={c.avatar || 'https://via.placeholder.com/40'} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}
                  </div>
                  <h5 className="chat-window-name">
                    u/{c.username}
                    {(unread[username] > 0) && <span className="chat-badge" style={{ marginLeft: 6, fontSize: '0.65rem' }}>{unread[username]}</span>}
                  </h5>
                </div>
                <div className="chat-window-actions">
                  <button className="chat-window-btn" onClick={e => toggleMin(username, e)}>{isMin ? '▲' : '−'}</button>
                  <button className="chat-window-btn" onClick={e => closeChat(username, e)} style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>✕</button>
                </div>
              </div>
              {!isMin && (
                <>
                  <div className="chat-window-messages">
                    {chatHistory.map((m, i) => {
                      const isOwn = m.senderId === user;
                      return (
                        <div key={m.id || i} className={`message-wrapper ${isOwn ? 'sent' : 'received'}`}>
                          <div className="message-bubble">{m.text}</div>
                          <span className="message-time">{m.time}</span>
                        </div>
                      );
                    })}
                    <div ref={el => endRefs.current[username] = el} />
                  </div>
                  <form onSubmit={e => sendMsg(username, e)} className="chat-window-input-area">
                    <input
                      type="text" 
                      placeholder="Escribe un mensaje..." 
                      className="chat-input"
                      value={inputs[username] || ''} 
                      onChange={e => setInputs(prev => ({ ...prev, [username]: e.target.value }))}
                    />
                    <button type="submit" className="chat-send-btn">➤</button>
                  </form>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra flotante para abrir contactos */}
      <div className="chat-main-bar">
        <div className="chat-main-header" onClick={() => setOpen(!open)}>
          <div className="chat-header-title">
            <span>💬 Mensajes Privados</span>
            {totalUnread > 0 && <span className="chat-badge">{totalUnread}</span>}
          </div>
          <span>{open ? '▼' : '▲'}</span>
        </div>
        {open && (
          <div className="chat-contacts-list">
            {contacts.length > 0 ? (
              contacts.map(c => (
                <div key={c.username} className="chat-contact-item" onClick={() => openChat(c.username)}>
                  <div className="chat-avatar-wrapper">
                    <div className="chat-avatar" style={{ background: c.avatar?.length === 1 ? '#2563eb' : 'transparent' }}>
                      {c.avatar?.length === 1 ? c.avatar : <img src={c.avatar || 'https://via.placeholder.com/40'} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}
                    </div>
                    <span className="status-dot online" />
                    </div>
                    <div className="chat-contact-info">
                    <h5 className="chat-contact-name">u/{c.username}</h5>
                    <p className="chat-contact-status">{c.bio?.length > 30 ? c.bio.substring(0, 30) + '...' : (c.bio || 'Sin biografía')}</p>
                  </div>
                  {(unread[c.username] > 0) && <span className="chat-badge">{unread[c.username]}</span>}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                No hay otros usuarios registrados.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatWidget;
