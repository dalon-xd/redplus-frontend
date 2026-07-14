import { useState } from 'react';

function Navbar({ theme, toggleTheme, setPantalla, onLogout, onSearch }) {
  const [query, setQuery] = useState(''); 

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (query.trim() !== '') {
        if (onSearch) onSearch(query);
        setPantalla('explore');
      }
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => setPantalla('home')} style={{ cursor: 'pointer' }}>
        RedPlus<span>+</span>
      </div>
      
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Buscar en RedPlus..." 
          className="search-input" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown} 
        />
      </div>

      <div className="nav-actions">
        <button onClick={toggleTheme} className="btn-theme">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <button className="btn-profile" onClick={() => setPantalla('profile')}>Mi Perfil</button>
        <button className="btn-theme" style={{ background: '#e74c3c', color: 'white', border: 'none' }} onClick={onLogout}>
          Salir
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
