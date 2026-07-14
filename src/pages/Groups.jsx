function Groups({ setPantalla, setActiveGroup, communities = [], joinedCommIds = [], onToggleJoin }) {
  return (
    <main className="content-feed">
      <div style={{ marginBottom: '20px' }}>
        <h2>Explorar Comunidades</h2>
        <p style={{ color: 'var(--text-muted)' }}>Descubre y únete a grupos en RedPlus</p>
      </div>

      {communities.length > 0 ? (
        communities.map((grupo) => {
          const isJoined = joinedCommIds.includes(grupo.id);
          return (
            <div 
              key={grupo.id} 
              className="project-card" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}
            >
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: 'var(--primary)' }}>r/{grupo.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{grupo.desc}</p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  👥 {grupo.members?.length || 0} miembros
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className={`btn-join ${isJoined ? 'joined' : ''}`}
                  onClick={() => onToggleJoin(grupo.id)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    background: isJoined ? 'var(--bg-main)' : 'var(--primary)', 
                    color: isJoined ? 'var(--text-main)' : 'white', 
                    border: isJoined ? '1px solid var(--border)' : 'none' 
                  }}
                >
                  {isJoined ? '✓ Unido' : '+ Unirse'}
                </button>
                <button 
                  className="btn-enter" 
                  onClick={() => setActiveGroup(grupo)} 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    background: 'var(--accent)', 
                    color: 'white', 
                    border: 'none' 
                  }}
                >
                  Ver Foro
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="project-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No hay comunidades creadas</h3>
          <p style={{ color: 'var(--text-muted)' }}>¡Sé el primero en crear una comunidad usando el menú de la izquierda!</p>
        </div>
      )}
    </main>
  );
}

export default Groups;