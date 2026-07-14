import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api'; 

const CHAT_USERS = ['kwioz020', 'carlos_omar', 'juan_dev', 'css_ninja', 'react_lover', 'java_coder'];
const CHAT_MSGS = [
  '¡Buenísimo el video!', '¿Por qué decidiste estructurarlo así?',
  '¡Esto está brutal!', '¿Qué plugin de VS Code usas?',
  '¡Súper limpio! 👍', '¿Habrá segunda parte?',
  'Se ve muy bien.', 'Los bugs de sintaxis siempre nos atrapan.'
];

const USER_COLORS = ['#e74c3c','#3498db','#2ecc71','#f1c40f','#e67e22','#9b59b6','#1abc9c','#e84393'];
const getUserColor = (name) => {
  if (name === 'u/usuario') return '#2563eb';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return USER_COLORS[Math.abs(h) % USER_COLORS.length];
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
};

function LiveStreams() {
  const [category, setCategory] = useState('Todos');
  const [stream, setStream] = useState(null);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef(null);

  const [livePosts, setLivePosts] = useState([]);
  const [categories, setCategories] = useState(['Todos']);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const streams = await api.getStreams();
        setLivePosts(streams);
        const commIds = streams.map(stream => stream.communityId);
        const uniqueComms = [...new Set(commIds)];
        setCategories(['Todos', ...uniqueComms]);
      } catch (error) {
        console.error('Error cargando directos:', error);
      }
    };
    fetchStreams();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    if (!stream) return;
    const id = setInterval(() => {
      const user = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
      const text = CHAT_MSGS[Math.floor(Math.random() * CHAT_MSGS.length)];
      setChat(prev => [...prev, { user, text }]);
    }, 3000);
    return () => clearInterval(id);
  }, [stream]);

  const enterStream = (s) => {
    setStream(s);
    setChat([
      { user: 'moderador_foro', text: `¡Bienvenidos a la publicación de ${s.author}!`, isSystem: true },
      { user: 'juan_dev', text: '¡Hola! Interesante video.' }
    ]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChat(prev => [...prev, { user: 'u/usuario', text: chatInput }]);
    setChatInput('');
  };

  if (stream) {
    return (
      <div className="twitch-layout">
        <aside className="twitch-sidebar">
          <div className="twitch-sidebar-header"><h4>En Directo</h4></div>
          <ul className="twitch-channel-list">
            {livePosts.map(ch => (
              <li key={ch.id} className={`twitch-channel-item ${stream.id === ch.id ? 'active' : ''}`} onClick={() => enterStream(ch)}>
                <div className="twitch-sidebar-avatar-wrapper">
                  <div className="twitch-sidebar-avatar live-border" style={{ background: getUserColor(ch.author) }}>{ch.author.charAt(0).toUpperCase()}</div>
                </div>
                <div className="twitch-channel-info-wrapper">
                  <h5 className="twitch-channel-name">{ch.author}</h5>
                  <p className="twitch-channel-category">r/{ch.communityId}</p>
                </div>
                <div className="twitch-live-stats">
                  <span className="twitch-dot-red" /><span>{ch.likes + 15}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="twitch-main-content">
          <div className="twitch-header-top">
            <button className="twitch-btn-back" onClick={() => setStream(null)}>⬅ Volver</button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>🔴 TRANSMITIENDO EN VIVO</span>
          </div>

          {/* AQUÍ VA EL REPRODUCTOR REAL DE YOUTUBE */}
          <div className="twitch-video-player" style={{ background: '#000', display: 'flex', aspectRatio: '16/9' }}>
             <iframe 
               width="100%" 
               height="100%" 
               src={getYouTubeEmbedUrl(stream.youtubeUrl)} 
               title="YouTube video player" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
               allowFullScreen
             ></iframe>
          </div>

          <div className="twitch-streamer-bar">
            <div className="twitch-streamer-info-left">
              <div className="twitch-streamer-avatar-live" style={{ background: getUserColor(stream.author) }}>{stream.author.charAt(0).toUpperCase()}</div>
              <div className="twitch-streamer-details">
                <div className="twitch-streamer-name-row">
                  <h3 className="twitch-streamer-name">{stream.author}</h3>
                  <span className="twitch-verify-badge">✔</span>
                </div>
                <h4 className="twitch-stream-title">{stream.title}</h4>
                <div className="twitch-stream-tags">
                  <span className="twitch-live-indicator">EN DIRECTO</span>
                  <span className="twitch-tag-badge category">r/{stream.communityId}</span>
                </div>
              </div>
            </div>
            <div className="twitch-streamer-actions">
              <button className="twitch-btn-follow">❤️ Me gusta ({stream.likes})</button>
            </div>
          </div>

          <div className="twitch-lower-sections">
            <div className="twitch-info-card">
              <h4>Acerca de la transmisión</h4>
              <p>{stream.body}</p>
            </div>
          </div>
        </main>

        <aside className="twitch-chat">
          <div className="twitch-chat-header">
            <h4>Chat del stream</h4>
            <span style={{ cursor: 'pointer' }}>👤</span>
          </div>
          <div className="twitch-pinned-card">
            <span className="twitch-pinned-icon">📌</span>
            <div className="twitch-pinned-content">
              <span className="twitch-pinned-author">Moderador:</span>
              <span>¡Disfruten del video y respeto en el chat!</span>
            </div>
          </div>

          <div className="twitch-chat-messages" ref={chatContainerRef}>
            {chat.map((msg, i) => (
              <div key={i} className="twitch-chat-row">
                {msg.isSystem
                  ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.72rem' }}>{msg.text}</span>
                  : <>
                      <span className="twitch-chat-badge-sub">Sub</span>
                      <span className="twitch-chat-user" style={{ color: getUserColor(msg.user) }}>{msg.user}</span>
                      <span className="twitch-chat-text">: {msg.text}</span>
                    </>
                }
              </div>
            ))}
          </div>

          <div className="twitch-chat-footer">
            <form onSubmit={sendMessage} className="twitch-chat-input-wrapper">
              <input
                type="text" placeholder="Enviar un mensaje"
                className="twitch-chat-input"
                value={chatInput} onChange={e => setChatInput(e.target.value)}
              />
              <div className="twitch-chat-input-actions">
                <button type="button" className="twitch-chat-icon-btn">😊</button>
                <button type="submit" className="twitch-chat-btn-send">Enviar</button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    );
  }

  const filtered = category === 'Todos' ? livePosts : livePosts.filter(s => s.communityId.toLowerCase() === category.toLowerCase());

  return (
    <main className="content-feed">
      <div style={{ marginBottom: '20px' }}>
        <h2>🔴 Videos y Directos en VIVO</h2>
        <p style={{ color: 'var(--text-muted)' }}>Explora publicaciones con video, asiste a explicaciones y chatea con los estudiantes.</p>
      </div>

      <div className="live-categories-bar">
        {categories.map(c => (
          <button 
            key={c} 
            className={`category-btn ${category === c ? 'active' : ''}`} 
            onClick={() => setCategory(c)}
          >
            {c === 'Todos' ? 'Todos' : `r/${c}`}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="live-grid">
          {filtered.map(s => (
            <div key={s.id} className="live-card" onClick={() => enterStream(s)}>
              {/* Le ponemos la miniatura oficial de YouTube como fondo */}
              <div className="live-thumbnail-wrapper" style={{ backgroundImage: `url(https://img.youtube.com/vi/${getYouTubeEmbedUrl(s.youtubeUrl)?.split('/').pop()?.split('?')[0]}/maxresdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <span className="live-badge">● VIVO</span>
                <span className="live-tag">r/{s.communityId}</span>
                <span className="live-viewer-count">❤️ {s.likes}</span>
              </div>
              <div className="live-card-body">
                <div className="live-streamer-avatar" style={{ background: getUserColor(s.author) }}>{s.author.charAt(0).toUpperCase()}</div>
                <div className="live-card-info">
                  <h4 className="live-card-title">{s.title}</h4>
                  <p className="live-card-author">{s.author}</p>
                  <span className="live-card-category">r/{s.communityId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          No hay directos ni videos disponibles en este momento.
        </div>
      )}
    </main>
  );
}

export default LiveStreams;
