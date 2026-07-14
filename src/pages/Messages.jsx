import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

function Messages({ user }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Cargar contactos al montar
  useEffect(() => {
    async function loadContacts() {
      try {
        const usersList = await api.getUsers();
        // Filtrar a uno mismo
        const otherUsers = usersList.filter(u => u.username.toLowerCase() !== user.toLowerCase());
        setContacts(otherUsers);
        if (otherUsers.length > 0) {
          setActiveContact(otherUsers[0]);
        }
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
      }
    }
    loadContacts();
  }, [user]);

  // Cargar mensajes entre el usuario logueado y el contacto activo
  useEffect(() => {
    if (!activeContact) return;

    let isMounted = true;
    async function loadMessages() {
      try {
        const allMsgs = await api.getMessages(user);
        // Filtrar mensajes relativos al contacto activo
        const chatMsgs = allMsgs.filter(m => 
          (m.senderId === user && m.receiverId === activeContact.username) ||
          (m.senderId === activeContact.username && m.receiverId === user)
        );
        if (isMounted) {
          setMessages(chatMsgs);
        }
      } catch (err) {
        console.error('Error al cargar mensajes:', err);
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Polling cada 3 segundos

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeContact, user]);

  // Auto scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeContact) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');

    // Agregar optimísticamente al estado local
    const tempMsg = {
      id: Date.now(),
      senderId: user,
      receiverId: activeContact.username,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      optimistic: true
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.sendMessage(user, activeContact.username, textToSend);
      // Reemplazar mensaje optimista con el real
      setMessages(prev => prev.map(m => m.optimistic && m.text === textToSend ? res.message : m));
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('Error al enviar mensaje. Inténtalo de nuevo.');
      setMessages(prev => prev.filter(m => !m.optimistic));
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      const res = await api.updateMessage(msgId, editingText.trim());
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: res.message.text } : m));
      setEditingMsgId(null);
      setEditingText('');
    } catch (err) {
      console.error('Error al editar mensaje:', err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!confirm('¿Seguro que deseas eliminar este mensaje?')) return;
    
    // Guardar copia local por si falla
    const previousMessages = [...messages];
    setMessages(prev => prev.filter(m => m.id !== msgId));

    try {
      await api.deleteMessage(msgId);
    } catch (err) {
      console.error('Error al eliminar mensaje:', err);
      setMessages(previousMessages);
      alert('No se pudo eliminar el mensaje.');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messenger-container">
      {/* PANEL IZQUIERDO: CONTACTOS */}
      <div className="messenger-contacts-panel">
        <div className="contacts-panel-header">
          <h3>Mensajes Privados</h3>
          <div className="contacts-search-box">
            <input 
              type="text" 
              placeholder="Buscar chat..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="contacts-list">
          {filteredContacts.length > 0 ? (
            filteredContacts.map(c => (
              <div 
                key={c.username} 
                className={`contact-item ${activeContact?.username === c.username ? 'active' : ''}`}
                onClick={() => setActiveContact(c)}
              >
                <div className="contact-avatar-col" style={{ 
                  background: c.avatar && c.avatar.length > 1 ? 'transparent' : '#2563eb',
                  color: 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontWeight: 'bold'
                }}>
                  {c.avatar && c.avatar.length > 1 ? (
                    <img src={c.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    c.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="contact-info-col">
                  <span className="contact-name">u/{c.username}</span>
                  <span className="contact-status-text">
                    {c.bio?.length > 35 ? c.bio.substring(0, 35) + '...' : (c.bio || 'Sin biografía')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="contacts-empty">No se encontraron chats.</div>
          )}
        </div>
      </div>

      {/* PANEL CENTRAL: CHAT */}
      <div className="messenger-chat-panel">
        {activeContact ? (
          <>
            <div className="chat-panel-header">
              <div className="chat-header-avatar" style={{ 
                background: activeContact.avatar && activeContact.avatar.length > 1 ? 'transparent' : '#2563eb',
                color: 'white',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '50%',
                fontWeight: 'bold'
              }}>
                {activeContact.avatar && activeContact.avatar.length > 1 ? (
                  <img src={activeContact.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  activeContact.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="chat-header-info">
                <h4>u/{activeContact.username}</h4>
                <p>Chat privado persistente</p>
              </div>
            </div>

            <div className="chat-messages-container">
              {messages.length > 0 ? (
                messages.map(m => {
                  const isOwn = m.senderId === user;
                  const isEditing = editingMsgId === m.id;

                  return (
                    <div key={m.id} className={`chat-message-row ${isOwn ? 'own' : 'incoming'}`}>
                      <div className="chat-message-bubble-wrapper">
                        {isEditing ? (
                          <div className="editing-input-wrapper">
                            <input 
                              type="text" 
                              value={editingText} 
                              onChange={e => setEditingText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveEdit(m.id)}
                            />
                            <div className="editing-buttons">
                              <button onClick={() => handleSaveEdit(m.id)} className="btn-save-edit">✓</button>
                              <button onClick={handleCancelEdit} className="btn-cancel-edit">✕</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="chat-message-bubble">
                              {m.text}
                            </div>
                            <span className="chat-message-time">{m.time}</span>
                          </>
                        )}
                      </div>

                      {/* Opciones del mensaje (solo para propios y no editando) */}
                      {isOwn && !isEditing && (
                        <div className="chat-message-options">
                          <button onClick={() => handleStartEdit(m)} title="Editar mensaje" className="btn-opt-edit">✏️</button>
                          <button onClick={() => handleDeleteMessage(m.id)} title="Eliminar mensaje" className="btn-opt-delete">🗑️</button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="chat-messages-empty">
                  <span>👋 Comienza la conversación con u/{activeContact.username}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-wrapper">
              <input 
                type="text" 
                placeholder="Escribe un mensaje..."
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
              />
              <button type="submit" className="chat-send-button">Enviar</button>
            </form>
          </>
        ) : (
          <div className="chat-panel-unselected">
            <div className="unselected-illustration">💬</div>
            <h3>Selecciona un contacto para iniciar</h3>
            <p>Tus mensajes privados están seguros y persistidos en el servidor.</p>
          </div>
        )}
      </div>

      {/* PANEL DERECHO: DETALLES DE USUARIO */}
      {activeContact && (
        <div className="messenger-details-panel">
          <div className="details-panel-card">
            <div className="details-avatar" style={{ 
              background: activeContact.avatar && activeContact.avatar.length > 1 ? 'transparent' : '#2563eb',
              color: 'white',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '50%',
              fontWeight: 'bold'
            }}>
              {activeContact.avatar && activeContact.avatar.length > 1 ? (
                <img src={activeContact.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                activeContact.username.charAt(0).toUpperCase()
              )}
            </div>
            <h4>u/{activeContact.username}</h4>
            <span className="details-badge">Estudiante / Miembro</span>
            
            <div className="details-info-section">
              <h5>Sobre mí</h5>
              <p>{activeContact.bio}</p>
            </div>

            {activeContact.habilities && activeContact.habilities.length > 0 && (
              <div className="details-info-section">
                <h5>Habilidades</h5>
                <div className="details-skills-list">
                  {activeContact.habilities.map(h => (
                    <span key={h} className="details-skill-tag">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
