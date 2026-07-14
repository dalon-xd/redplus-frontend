import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

function GroupChat({ group, setPantalla, user }) {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const mensajesFinRef = useRef(null); 

  const cargarMensajes = async () => {
    if (!group) return;
    try {
      const data = await api.getGroupChats(group.id);
      setMensajes(data);
    } catch (err) {
      console.error('Error cargando chat de grupo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMensajes();
    const interval = setInterval(cargarMensajes, 2500); // Polling del chat en vivo cada 2.5s
    return () => clearInterval(interval);
  }, [group]);

  useEffect(() => {
    mensajesFinRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const textoMsg = nuevoMensaje.trim();
    setNuevoMensaje('');

    // Agregar optimísticamente
    const localMsg = {
      id: Date.now(),
      emisor: `u/${user}`,
      texto: textoMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      propio: true
    };
    setMensajes(prev => [...prev, localMsg]);

    try {
      const res = await api.sendGroupChat(group.id, `u/${user}`, textoMsg);
      // Reemplazar localMsg con el guardado en el backend
      setMensajes(prev => prev.map(m => m.id === localMsg.id ? res.message : m));

      // Simulamos respuesta de un bot en la comunidad, guardándolo también en el backend
      setTimeout(async () => {
        const respuestasMock = [
          '¡Interesante aporte!', 
          'Totalmente de acuerdo contigo.', 
          '¿Podrías explicar un poco más sobre eso?', 
          'Voy a probar eso en mi próximo proyecto.'
        ];
        const respuestaAleatoria = respuestasMock[Math.floor(Math.random() * respuestasMock.length)];
        
        try {
          const botRes = await api.sendGroupChat(group.id, 'bot_comunidad', respuestaAleatoria);
          setMensajes(prev => [...prev, botRes.message]);
        } catch (botErr) {
          console.error(botErr);
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Error al enviar mensaje al chat en vivo.');
    }
  };

  if (!group) return null;

  return (
    <main className="content-feed">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button 
          onClick={() => setPantalla('groupForum')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ⬅ Volver
        </button>
        <div>
          <h2 style={{ margin: '0' }}>Canal: {group.name}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0', fontSize: '14px' }}>🟢 Conectado vía HTTP Polling (Persistido)</p>
        </div>
      </div>

      <div className="group-chat-box project-card" style={{ display: 'flex', flexDirection: 'column', height: '60vh', padding: '0', overflow: 'hidden' }}>
        
        {/* Área de mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando chat...</div>
          ) : mensajes.length > 0 ? (
            mensajes.map((msg) => {
              const esPropio = msg.emisor === `u/${user}`;
              return (
                <div key={msg.id} style={{ alignSelf: esPropio ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', textAlign: esPropio ? 'right' : 'left' }}>
                    {msg.emisor}
                  </span>
                  <div style={{ 
                    background: esPropio ? 'var(--primary)' : 'var(--bg-card)', 
                    color: esPropio ? 'white' : 'var(--text-main)',
                    padding: '10px 15px', 
                    borderRadius: '12px',
                    border: esPropio ? 'none' : '1px solid var(--border)'
                  }}>
                    {msg.texto}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block', textAlign: esPropio ? 'right' : 'left' }}>
                    {msg.time}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay mensajes. Escribe algo para iniciar.</div>
          )}
          <div ref={mensajesFinRef} />
        </div>

        {/* Input para enviar mensajes */}
        <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '15px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          <input 
            type="text" 
            placeholder={`Escribe un mensaje en ${group.name}...`}
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
          />
          <button type="submit" style={{ marginLeft: '10px', background: 'var(--primary)', color: 'white', border: 'none', padding: '0 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
            Enviar
          </button>
        </form>

      </div>
    </main>
  );
}

export default GroupChat;