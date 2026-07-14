import { useState } from 'react';

function Sidebar({ 
  pantalla, 
  setPantalla, 
  communities = [], 
  joinedCommIds = [], 
  recientesIds = [], 
  onSelectGroup,
  onCreateCommClick
}) {
  const [recienteOpen, setRecienteOpen] = useState(true);
  const [comunidadesOpen, setComunidadesOpen] = useState(true);

  // Filtrar comunidades correspondientes
  const joinedCommunities = communities.filter(c => joinedCommIds.includes(c.id));
  const recienteCommunities = RecentUnique(communities, recientesIds);

  function RecentUnique(comms, ids) {
    const list = [];
    ids.forEach(id => {
      const found = comms.find(c => c.id === id);
      if (found) list.push(found);
    });
    return list;
  }

  const handleGroupClick = (group) => {
    if (onSelectGroup) {
      onSelectGroup(group);
    }
  };

  return (
    <aside className="reddit-sidebar">
      {/* SECCIÓN 1: NAVEGACIÓN PRINCIPAL */}
      <ul className="sidebar-menu">
        <li 
          className={`sidebar-menu-item ${pantalla === 'home' ? 'active' : ''}`} 
          onClick={() => setPantalla('home')}
        >
          <span className="sidebar-icon">🏠</span>
          <span className="sidebar-label">Principal</span>
        </li>
        <li 
          className={`sidebar-menu-item ${pantalla === 'popular' ? 'active' : ''}`} 
          onClick={() => setPantalla('popular')}
        >
          <span className="sidebar-icon">📈</span>
          <span className="sidebar-label">Popular</span>
        </li>
        <li 
          className={`sidebar-menu-item ${pantalla === 'explore' ? 'active' : ''}`} 
          onClick={() => setPantalla('explore')}
        >
          <span className="sidebar-icon">🔍</span>
          <span className="sidebar-label">Explorar</span>
        </li>
        <li 
          className={`sidebar-menu-item ${pantalla === 'live' ? 'active' : ''}`} 
          onClick={() => setPantalla('live')}
        >
          <span className="sidebar-icon">🎥</span>
          <span className="sidebar-label">Videos y Directos</span>
        </li>
        <li 
          className={`sidebar-menu-item ${pantalla === 'messages' ? 'active' : ''}`} 
          onClick={() => setPantalla('messages')}
        >
          <span className="sidebar-icon">✉️</span>
          <span className="sidebar-label">Mensajes</span>
        </li>
        <li 
          className="sidebar-menu-item" 
          onClick={onCreateCommClick}
        >
          <span className="sidebar-icon">➕</span>
          <span className="sidebar-label">Crear una comunidad</span>
        </li>
      </ul>

      <hr className="sidebar-divider" />

      {/* SECCIÓN 2: RECIENTE */}
      <div className="sidebar-section">
        <div 
          className="sidebar-section-header" 
          onClick={() => setRecienteOpen(!recienteOpen)}
        >
          <span>RECIENTE</span>
          <span className={`arrow-toggle ${recienteOpen ? 'open' : ''}`}>▼</span>
        </div>
        {recienteOpen && (
          <ul className="sidebar-sublist">
            {recienteCommunities.length > 0 ? (
              recienteCommunities.map(c => (
                <li 
                  key={`rec-${c.id}`} 
                  className="sidebar-sublist-item"
                  onClick={() => handleGroupClick(c)}
                >
                  <span className="sublist-prefix">r/</span>
                  <span className="sublist-name">{c.name}</span>
                </li>
              ))
            ) : (
              <li className="sidebar-empty-text">Ninguna reciente</li>
            )}
          </ul>
        )}
      </div>

      <hr className="sidebar-divider" />

      {/* SECCIÓN 3: COMUNIDADES */}
      <div className="sidebar-section">
        <div 
          className="sidebar-section-header" 
          onClick={() => setComunidadesOpen(!comunidadesOpen)}
        >
          <span>MIS COMUNIDADES</span>
          <span className={`arrow-toggle ${comunidadesOpen ? 'open' : ''}`}>▼</span>
        </div>
        {comunidadesOpen && (
          <ul className="sidebar-sublist">
            {joinedCommunities.length > 0 ? (
              joinedCommunities.map(c => (
                <li 
                  key={`join-${c.id}`} 
                  className="sidebar-sublist-item"
                  onClick={() => handleGroupClick(c)}
                >
                  <span className="sublist-prefix">r/</span>
                  <span className="sublist-name">{c.name}</span>
                </li>
              ))
            ) : (
              <li className="sidebar-empty-text">No te has unido a ninguna</li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;