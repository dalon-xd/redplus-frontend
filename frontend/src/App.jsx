import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import LiveStreams from './pages/LiveStreams';
import ChatWidget from './components/ChatWidget';
import GroupChat from './pages/GroupChat';
import GroupForum from './pages/GroupForum';
import Register from './pages/Register';
import Messages from './pages/Messages';
import { api } from './services/api';

function App() {
  const [theme, setTheme] = useState('light');
  const [pantalla, setPantalla] = useState(() => {
    return localStorage.getItem('saved_pantalla') || 'home';
  });
  const [activeGroup, setActiveGroup] = useState(() => {
    const saved = localStorage.getItem('saved_activeGroup');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('session_isLoggedIn') === 'true';
  });
  const [esLogin, setEsLogin] = useState(true);
  const [user, setUser] = useState(() => {
    return localStorage.getItem('session_user') || '';
  });
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  // Estados para el buscador
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados unificados del backend
  const [communities, setCommunities] = useState([]);
  const [joinedCommIds, setJoinedCommIds] = useState([]);
  const [recientesIds, setRecientesIds] = useState([]);

  // Modal para crear comunidad
  const [isCreateCommOpen, setIsCreateCommOpen] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [commError, setCommError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('saved_pantalla', pantalla);
  }, [pantalla]);

  useEffect(() => {
    if (activeGroup) {
      localStorage.setItem('saved_activeGroup', JSON.stringify(activeGroup));
    } else {
      localStorage.removeItem('saved_activeGroup');
    }
  }, [activeGroup]);
  
  // Cargar datos al iniciar sesión
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    async function loadData() {
      try {
        const comms = await api.getCommunities();
        setCommunities(comms);
        setJoinedCommIds(comms.filter(c => c.members?.includes(user)).map(c => c.id));

        const rec = await api.getRecientes(user);
        setRecientesIds(rec);
      } catch (err) {
        console.error('Error cargando comunidades del backend:', err);
      }
    }
    loadData();
  }, [isLoggedIn, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.login(user, pass);
      if (res.success) {
        setIsLoggedIn(true);
        setUser(res.user.username);
        localStorage.setItem('session_isLoggedIn', 'true');
        localStorage.setItem('session_user', res.user.username);
      }
    } catch (err) {
      setError(err.message || 'Usuario no registrado o contraseña incorrecta.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser('');
    localStorage.removeItem('session_isLoggedIn');
    localStorage.removeItem('session_user');
    setPantalla('home');
  };

  const handleSelectGroup = async (group) => {
    setActiveGroup(group);
    setPantalla('groupForum');
    try {
      // Registrar visita en el backend
      const res = await api.addReciente(user, group.id);
      setRecientesIds(res.recientes);
    } catch (err) {
      console.error('Error al guardar comunidad reciente:', err);
    }
  };

  const handleToggleJoin = async (groupId) => {
    try {
      await api.joinCommunity(groupId, user);
      // Recargar comunidades
      const comms = await api.getCommunities();
      setCommunities(comms);
      setJoinedCommIds(comms.filter(c => c.members?.includes(user)).map(c => c.id));
    } catch (err) {
      console.error('Error al unirse/salir del grupo:', err);
    }
  };

  const handleCreateCommunitySubmit = async (e) => {
    e.preventDefault();
    setCommError('');
    if (!newCommName.trim()) return;

    const id = newCommName.trim().toLowerCase().replace(/\s+/g, '-');
    try {
      await api.createCommunity(id, newCommName.trim(), newCommDesc.trim());
      
      // Unirse automáticamente
      await api.joinCommunity(id, user);

      // Recargar comunidades y cerrar modal
      const comms = await api.getCommunities();
      setCommunities(comms);
      setJoinedCommIds(comms.filter(c => c.members?.includes(user)).map(c => c.id));
      
      setIsCreateCommOpen(false);
      setNewCommName('');
      setNewCommDesc('');
      
      // Ir a la nueva comunidad
      const newCommObj = comms.find(c => c.id === id);
      if (newCommObj) {
        handleSelectGroup(newCommObj);
      }
    } catch (err) {
      setCommError(err.message || 'Error al crear la comunidad.');
    }
  };

  const handleSearch = async (query) => {
    try {
      setSearchQuery(query);
      const results = await api.search(query);
      setSearchResults(results);
      setPantalla('search'); 
    } catch (err) {
      console.error('Error al buscar:', err);
    }
  };

  const cambiarVista = () => {
    if (pantalla === 'profile') return <Profile user={user} />;
    
    if (pantalla === 'search') {
      return (
        <main className="content-feed">
          <div style={{ marginBottom: '20px' }}>
            <h2>🔍 Resultados para: "{searchQuery}"</h2>
            <p style={{ color: 'var(--text-muted)' }}>{searchResults.length} publicaciones encontradas</p>
          </div>
          
          {searchResults.length > 0 ? (
            searchResults.map(post => (
              <div key={post.id} className="post-card" style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>r/{post.communityId}</span>
                <h3 style={{ margin: '5px 0' }}>{post.title}</h3>
                <p style={{ color: 'var(--text-color)', fontSize: '14px' }}>{post.body}</p>
                
                {/* --- BOTÓN DE VIDEO PARA EL BUSCADOR --- */}
                {post.youtubeUrl && (
                  <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <button 
                      onClick={() => setPantalla('live')}
                      style={{
                        backgroundColor: '#ef4444', color: 'white', border: 'none', 
                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', 
                        fontWeight: 'bold', fontSize: '12px'
                      }}
                    >
                      ▶ Ver video aquí
                    </button>
                  </div>
                )}
                {/* --------------------------------------- */}

                <small style={{ color: 'var(--text-muted)' }}>Publicado por: u/{post.author}</small>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No se encontraron coincidencias.
            </div>
          )}
        </main>
      );
    }
    
    if (pantalla === 'explore') {
      return (
        <Groups 
          setPantalla={setPantalla} 
          setActiveGroup={handleSelectGroup}
          communities={communities}
          joinedCommIds={joinedCommIds}
          onToggleJoin={handleToggleJoin}
        />
      );
    }

    if (pantalla === 'groupForum') {
      // Buscar información fresca del grupo activo
      const freshGroup = communities.find(c => c.id === activeGroup?.id) || activeGroup;
      return (
        <GroupForum 
          group={freshGroup} 
          setPantalla={setPantalla} 
          user={user}
          isJoined={joinedCommIds.includes(freshGroup?.id)}
          onToggleJoin={handleToggleJoin}
        />
      );
    }

    if (pantalla === 'groupChat') {
      return <GroupChat group={activeGroup} setPantalla={setPantalla} user={user} />;
    }

    if (pantalla === 'live') return <LiveStreams />;
    if (pantalla === 'messages') return <Messages user={user} />;

    // Vista principal ('home') y popular ('popular')
    return <Home user={user} isPopularView={pantalla === 'popular'} joinedCommIds={joinedCommIds} setPantalla={setPantalla} onSearch={handleSearch} />;
  };

  if (!isLoggedIn) {
    if (!esLogin) {
      return <Register setEsLogin={setEsLogin} />;
    }

    return (
      <div className="login-box">
        <form onSubmit={handleLogin}>
          <h2>RedPlus</h2>
          {error && <p className="error">{error}</p>}
          <input 
            type="text" 
            placeholder="Usuario" 
            value={user}
            onChange={e => setUser(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={pass}
            onChange={e => setPass(e.target.value)} 
            required 
          />
          <button type="submit">Entrar</button>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '15px' }}>
            ¿No tienes cuenta?{' '}
            <span 
              onClick={() => setEsLogin(false)} 
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Regístrate aquí
            </span>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        theme={theme} 
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
        setPantalla={setPantalla} 
        onLogout={handleLogout}
        onSearch={handleSearch}
      />
      <div className="main-layout">
        <Sidebar 
          pantalla={pantalla}
          setPantalla={setPantalla} 
          communities={communities}
          joinedCommIds={joinedCommIds}
          recientesIds={recientesIds}
          onSelectGroup={handleSelectGroup}
          onCreateCommClick={() => setIsCreateCommOpen(true)}
        />
        {cambiarVista()}
      </div>

      {/* Chat flotante al pie persistido en el backend */}
      <ChatWidget user={user} />

      {/* MODAL DE CREACIÓN DE COMUNIDAD */}
      {isCreateCommOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateCommOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear una comunidad</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateCommOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCommunitySubmit}>
              {commError && <p className="error">{commError}</p>}
              <div className="form-group">
                <label>Nombre de la comunidad</label>
                <input 
                  type="text" 
                  placeholder="r/Ejemplo" 
                  value={newCommName}
                  onChange={e => setNewCommName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  placeholder="¿De qué trata tu comunidad? (Opcional)" 
                  value={newCommDesc}
                  onChange={e => setNewCommDesc(e.target.value)}
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateCommOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-submit">Crear comunidad</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;