import { useState, useEffect } from 'react';
import { api } from '../services/api';

const TRENDING = [
  { tag: '#Retrogaming', posts: '15.4k posts', category: 'Gaming' },
  { tag: '#HTML',        posts: '8.2k posts',  category: 'Consolas' },
  { tag: '#TechPeru',    posts: '12.1k posts', category: 'Tecnología' },
  { tag: '#WebDev',      posts: '24.9k posts', category: 'Programación' }
];

function Home({ user, isPopularView, joinedCommIds = [], setPantalla, onSearch }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nuevoPostTags, setNuevoPostTags] = useState('');
  const [tendencias, setTendencias] = useState([]);

  // Estados para creación
  const [nuevoPostTitulo, setNuevoPostTitulo] = useState('');
  const [nuevoPostTexto, setNuevoPostTexto] = useState('');

  // Estados para comentarios nuevos
  const [nuevosComentarios, setNuevosComentarios] = useState({});
  const [postAbierto, setPostAbierto] = useState({});

  // Estados para edición de post
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  // Estados para edición de comentarios
  const [editingCommentKey, setEditingCommentKey] = useState(null); // 'postId-commentId'
  const [editCommentText, setEditCommentText] = useState('');

  // Cargar publicaciones de la API
  const cargarPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getPosts();
      setPublicaciones(data);
      const trendsData = await api.getTrends();
      setTendencias(trendsData);
    } catch (err) {
      console.error('Error al cargar publicaciones:', err);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    cargarPosts();
  }, []);

  const handleCrearPost = async (e) => {
    e.preventDefault();
    if (!nuevoPostTexto.trim() || !nuevoPostTitulo.trim()) return;

    const tagsArray = nuevoPostTags
      .split(',')
      .map(tag => tag.trim().toLowerCase().replace('#', ''))
      .filter(tag => tag !== '');

    try {
      const res = await api.createPost(user, nuevoPostTitulo.trim(), nuevoPostTexto.trim(), 'general', null, tagsArray);
      if (res.success) {
        setNuevoPostTitulo('');
        setNuevoPostTexto('');
        setNuevoPostTags(''); 
        await cargarPosts();
      }
    } catch (err) {
      console.error(err);
      alert('Error al crear publicación.');
    }
  };

  const handleLike = async (id) => {
    try {
      // Modificar optimísticamente en UI
      setPublicaciones(prev => prev.map(post => {
        if (post.id === id) {
          const yaDioLike = post.usuariosLike?.includes(user);
          let nuevosLikes = post.likes;
          let nuevosUsuarios = [...(post.usuariosLike || [])];

          if (yaDioLike) {
            nuevosLikes -= 1;
            nuevosUsuarios = nuevosUsuarios.filter(u => u !== user);
          } else {
            nuevosLikes += 1;
            nuevosUsuarios.push(user);
          }
          return { ...post, likes: nuevosLikes, usuariosLike: nuevosUsuarios };
        }
        return post;
      }));

      await api.likePost(id, user);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComentarios = (id) => {
    setPostAbierto({
      ...postAbierto,
      [id]: !postAbierto[id]
    });
  };

  const handleInputChange = (postId, texto) => {
    setNuevosComentarios({
      ...nuevosComentarios,
      [postId]: texto
    });
  };

  const handleAddComentario = async (e, postId) => {
    e.preventDefault();
    const textoComentario = nuevosComentarios[postId];
    if (!textoComentario || !textoComentario.trim()) return;

    try {
      const res = await api.addComment(postId, user, textoComentario.trim());
      if (res.success) {
        setNuevosComentarios({
          ...nuevosComentarios,
          [postId]: ''
        });
        // Actualizar el post respectivo en el listado local
        setPublicaciones(prev => prev.map(p => p.id === postId ? res.post : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Acciones de Post (Editar / Eliminar)
  const handleStartEditPost = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
  };

  const handleSaveEditPost = async (id) => {
    if (!editTitle.trim() || !editBody.trim()) return;
    try {
      const res = await api.updatePost(id, editTitle.trim(), editBody.trim());
      if (res.success) {
        setPublicaciones(prev => prev.map(p => p.id === id ? { ...p, title: res.post.title, body: res.post.body } : p));
        setEditingPostId(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar cambios.');
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    try {
      await api.deletePost(id);
      setPublicaciones(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar publicación.');
    }
  };

  // Acciones de Comentario (Editar / Eliminar)
  const handleStartEditComment = (postId, comment) => {
    setEditingCommentKey(`${postId}-${comment.id}`);
    setEditCommentText(comment.texto);
  };

  const handleSaveEditComment = async (postId, commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api.updateComment(postId, commentId, editCommentText.trim());
      if (res.success) {
        setPublicaciones(prev => prev.map(p => p.id === postId ? res.post : p));
        setEditingCommentKey(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('¿Deseas eliminar este comentario?')) return;
    try {
      const res = await api.deleteComment(postId, commentId);
      if (res.success) {
        setPublicaciones(prev => prev.map(p => p.id === postId ? res.post : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrar publicaciones si es vista "Popular"
  // "lo que es favorito en votos en mis cominudades unidas"
  // Filtra posts que pertenezcan a comunidades en joinedCommIds y los ordena por likes descendente.
  const postsAMostrar = isPopularView
    ? publicaciones
        .filter(p => p.communityId !== 'general' && joinedCommIds.includes(p.communityId))
        .sort((a, b) => b.likes - a.likes)
    : publicaciones;

  return (
    <>
      <main className="content-feed">
        <div className="feed-header">
          <h2>{isPopularView ? '🔥 Publicaciones Populares' : '🏠 Muro Principal'}</h2>
          <p>Bienvenido de vuelta, u/{user}</p>
        </div>

        {/* Solo mostrar la caja de crear post en la vista general */}
        {!isPopularView && (
          <form onSubmit={handleCrearPost} className="project-card create-post-card">
            <h3>Crear una publicación</h3>
            <input 
              type="text" 
              placeholder="Título de la publicación..." 
              value={nuevoPostTitulo}
              onChange={(e) => setNuevoPostTitulo(e.target.value)}
              required
              className="create-post-title"
            />
            <textarea 
              placeholder="¿Qué estás pensando hoy, u/usuario?" 
              value={nuevoPostTexto}
              onChange={(e) => setNuevoPostTexto(e.target.value)}
              required
              rows="3"
              className="create-post-body"
            />
            <input 
              type="text" 
              placeholder="Tags separados por coma (ej: Programación, Hardware, Dudas)" 
              value={nuevoPostTags}
              onChange={(e) => setNuevoPostTags(e.target.value)}
              className="create-post-title"
              style={{ marginTop: '10px', fontSize: '13px', borderColor: '#3b82f644' }}
            />
            <div className="create-post-footer">
              <button type="submit" className="btn-primary">Publicar</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="loading-container">Cargando publicaciones...</div>
        ) : postsAMostrar.length > 0 ? (
          postsAMostrar.map((p) => {
            const dioLike = p.usuariosLike?.includes(user);
            const estaAbierto = postAbierto[p.id];
            const isOwnPost = p.author === user;
            const isEditingPost = editingPostId === p.id;

            return (
              <article key={p.id} className="project-card reddit-post">
                <div className="card-header">
                  <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: 'white', fontWeight: 'bold' }}>
                    {p.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="post-meta-info">
                    <h4>u/{p.author}</h4>
                    <span className="user-badge">
                      {p.communityId !== 'general' ? `r/${p.communityId}` : 'Publicación General'}
                    </span>
                  </div>
                  {isOwnPost && !isEditingPost && (
                    <div className="post-actions-menu">
                      <button className="btn-menu-edit" onClick={() => handleStartEditPost(p)}>✏️</button>
                      <button className="btn-menu-delete" onClick={() => handleDeletePost(p.id)}>🗑️</button>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  {isEditingPost ? (
                    <div className="post-editing-box">
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="edit-post-title-input"
                      />
                      <textarea 
                        value={editBody} 
                        onChange={e => setEditBody(e.target.value)} 
                        className="edit-post-body-input"
                        rows="4"
                      />
                      <div className="post-editing-actions">
                        <button onClick={() => handleSaveEditPost(p.id)} className="btn-save">Guardar</button>
                        <button onClick={handleCancelEditPost} className="btn-cancel">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{p.title}</h3>
                      <p>{p.body}</p>
                    {/* --- BOTÓN DE VIDEO PARA EL MURO PRINCIPAL/POPULAR --- */}
                      {p.youtubeUrl && (
                        <div style={{ marginTop: '15px' }}>
                          <button 
                            onClick={() => setPantalla('live')}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '14px',
                              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                            }}
                          >
                            ▶ Ver video aquí
                          </button>
                        </div>
                      )}
                      {/* ----------------------------------------------------- */}
                    </>
                  )}
                </div>

                <div className="card-footer">
                  <button 
                    className="btn-action btn-like" 
                    onClick={() => handleLike(p.id)}
                    style={{ color: dioLike ? '#10b981' : 'inherit', fontWeight: dioLike ? 'bold' : 'normal' }}
                  >
                    {dioLike ? '❤️ Apoyado' : '👍 Apoyar'} ({p.likes})
                  </button>
                  <button className="btn-action" onClick={() => toggleComentarios(p.id)}>
                    💬 Comentar ({p.comentarios?.length || 0})
                  </button>
                </div>

                {estaAbierto && (
                  <div className="comments-section">
                    <div className="comments-list">
                      {p.comentarios && p.comentarios.length > 0 ? (
                        p.comentarios.map((com) => {
                          const isOwnComment = com.autor === user;
                          const isEditingComment = editingCommentKey === `${p.id}-${com.id}`;

                          return (
                            <div key={com.id} className="comment-item">
                              <div className="comment-header">
                                <span className="comment-author">u/{com.autor}</span>
                                {isOwnComment && !isEditingComment && (
                                  <div className="comment-opt-actions">
                                    <button onClick={() => handleStartEditComment(p.id, com)}>Editar</button>
                                    <button onClick={() => handleDeleteComment(p.id, com.id)}>Eliminar</button>
                                  </div>
                                )}
                              </div>
                              <div className="comment-body">
                                {isEditingComment ? (
                                  <div className="comment-editing-box">
                                    <input 
                                      type="text" 
                                      value={editCommentText} 
                                      onChange={e => setEditCommentText(e.target.value)} 
                                    />
                                    <button onClick={() => handleSaveEditComment(p.id, com.id)}>✓</button>
                                    <button onClick={() => setEditingCommentKey(null)}>✕</button>
                                  </div>
                                ) : (
                                  <p>{com.texto}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="no-comments-text">No hay comentarios aún. ¡Sé el primero!</p>
                      )}
                    </div>
                    <form onSubmit={(e) => handleAddComentario(e, p.id)} className="comment-form">
                      <input 
                        type="text" 
                        placeholder="Escribe un comentario..." 
                        value={nuevosComentarios[p.id] || ''}
                        onChange={(e) => handleInputChange(p.id, e.target.value)}
                        required
                      />
                      <button type="submit">Enviar</button>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="empty-feed-card">
            <h3>No hay publicaciones para mostrar</h3>
            {isPopularView ? (
              <p>Únete a comunidades y apoya publicaciones para ver contenido aquí.</p>
            ) : (
              <p>¡Crea la primera publicación en el muro!</p>
            )}
          </div>
        )}
      </main>

      <aside className="sidebar trending-aside" style={{ width: '280px' }}>
        <h3>⚡ Tendencias para ti</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
          {tendencias.length > 0 ? (
            tendencias.map((t, i) => (
              <div 
                key={i} 
                style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => {
                  if (onSearch) onSearch(t.tag);
                }}
              >
                <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '14px', color: 'var(--primary)' }}>
                  <span style={{ transition: 'color 0.2s' }} className="hover-trend">#{t.tag}</span>
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.posts} publicaciones</span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aún no hay tendencias.</p>
          )}
        </div>
      </aside>
    </>
  );
}

export default Home;
