import { useState, useEffect } from 'react';
import { api } from '../services/api';

function Profile({ user }) {
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  
  // Datos del perfil
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [habilidades, setHabilidades] = useState([]);
  
  const [nuevaHabilidad, setNuevaHabilidad] = useState('');

  // Cargar datos del perfil del backend / fallback
  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const usuarios = await api.getUsers();
      const datos = usuarios.find(u => u.username.toLowerCase() === user.toLowerCase()) || {
        username: user,
        bio: '¡Hola! Bienvenido a mi perfil en RedPlus.',
        avatar: '👤',
        habilities: ['React', 'CSS', 'Vite']
      };

      setBio(datos.bio || '');
      setAvatar(datos.avatar || '👤');
      setHabilidades(datos.habilities || []);
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarCambios = async () => {
    try {
      await api.updateProfile({
        username: user,
        bio,
        avatar,
        habilities: habilidades
      });
      setEditando(false);
      alert('¡Perfil actualizado con éxito!');
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios del perfil.');
    }
  };

  const agregarHabilidad = (e) => {
    e.preventDefault();
    if (nuevaHabilidad.trim() && !habilidades.includes(nuevaHabilidad.trim())) {
      setHabilidades([...habilidades, nuevaHabilidad.trim()]);
      setNuevaHabilidad('');
    }
  };

  const eliminarHabilidad = (hab) => {
    setHabilidades(habilidades.filter(h => h !== hab));
  };

  if (loading) {
    return <div className="loading-container">Cargando perfil...</div>;
  }

  return (
    <>
      <main className="feed">
        <div className="post project-card" style={{ padding: '20px' }}>
          <div className="profile-banner" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
            <div className="avatar" style={{ 
              overflow: 'hidden', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: '#2a3c42',
              fontSize: '30px'
            }}>
              {avatar && avatar.length > 10 ? (
                <img 
                  src={avatar} 
                  alt="avatar" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block' 
                  }} 
                />
              ) : (
                "👤"
              )}
            </div>
            <h2>u/{user}</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Miembro Estudiante Universitario</p>
          
          {editando ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Subir nueva foto de perfil:</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ marginBottom: '5px' }}
              />

              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Biografía:</label>
              <textarea 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '60px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                value={bio} 
                onChange={e => setBio(e.target.value)} 
              />

              <button className="btn-profile btn-submit" onClick={guardarCambios}>Guardar Cambios</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{bio || "Sin biografía aún."}</p>
              <button className="btn-theme" style={{ marginTop: '10px', marginBottom: '15px' }} onClick={() => setEditando(true)}>
                ✏️ Editar Perfil
              </button>
            </>
          )}

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
            <h4>Tecnologías de Interés</h4>
            
            {editando && (
              <form onSubmit={agregarHabilidad} style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Nueva habilidad..." 
                  className="search-input"
                  style={{ width: '150px' }}
                  value={nuevaHabilidad}
                  onChange={e => setNuevaHabilidad(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: '4px 12px', borderRadius: '6px' }}>+ Añadir</button>
              </form>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              {habilidades.length > 0 ? (
                habilidades.map((hab, index) => (
                  <span key={index} style={{ background: 'var(--bg-main)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border)' }}>
                    {hab}
                    {editando && (
                      <button 
                        type="button" 
                        onClick={() => eliminarHabilidad(hab)}
                        style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ninguna habilidad agregada.</span>
              )}
            </div>
          </div>
        </div>
      </main>

      <aside className="side-right" style={{ width: '280px' }}>
        <div className="trending-card project-card">
          <h3>Estadísticas u/{user}</h3>
          <p style={{ fontSize: '14px', margin: '5px 0' }}>Karma de Post: 18</p>
          <p style={{ fontSize: '14px', margin: '5px 0' }}>Comentarios: 5</p>
        </div>
      </aside>
    </>
  );
}

export default Profile;