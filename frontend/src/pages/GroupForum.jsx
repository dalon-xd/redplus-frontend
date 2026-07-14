import { useState, useEffect } from 'react';
import { api } from '../services/api';

function GroupForum({ group, setPantalla, user, isJoined, onToggleJoin }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para nuevo post
  const [nuevoPostTitulo, setNuevoPostTitulo] = useState('');
  const [nuevoPostTexto, setNuevoPostTexto] = useState('');
  const [nuevoPostYoutube, setNuevoPostYoutube] = useState('');
  const [nuevoPostTags, setNuevoPostTags] = useState('');

  // Estados para comentarios nuevos
  const [nuevosComentarios, setNuevosComentarios] = useState({});
  const [postAbierto, setPostAbierto] = useState({});

  // Estados para edición
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const [editingCommentKey, setEditingCommentKey] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const cargarPublicaciones = async () => {
    if (!group) return;
    try {
      setLoading(true);
      const allPosts = await api.getPosts();
      // Filtrar por ID de la comunidad actual
      const filtered = allPosts.filter(p => p.communityId === group.id);
      setPublicaciones(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPublicaciones();
  }, [group]);

  if (!group) return null;

  const handleCrearPost = async (e) => {
    e.preventDefault();
    if (!nuevoPostTitulo.trim() || !nuevoPostTexto.trim()) return;

const tagsArray = nuevoPostTags
      .split(',')
      .map(tag => tag.trim().toLowerCase().replace('#', ''))
      .filter(tag => tag !== '');

    try {
      const res = await api.createPost(user, nuevoPostTitulo.trim(), nuevoPostTexto.trim(), group.id, nuevoPostYoutube.trim(), tagsArray);
      if (res.success) {
        setNuevoPostTitulo('');
        setNuevoPostTexto('');
        setNuevoPostYoutube('');
        setNuevoPostTags(''); 
        await cargarPublicaciones();
      }
    } catch (err) {
      console.error(err);
      alert('Error al crear publicación.');
    }
  };

  const handleLike = async (id) => {
    try {
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
        setPublicaciones(prev => prev.map(p => p.id === postId ? res.post : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Acciones Post (Editar / Eliminar)
  const handleStartEditPost = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
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
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    try {
      await api.deletePost(id);
      setPublicaciones(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Acciones Comentario (Editar / Eliminar)
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

  return (
    <main className="content-feed">
      {/* Cabecera del foro */}
      <div className="forum-header-card project-card">
        <div className="forum-header-main">
          <button 
            onClick={() => setPantalla('explore')}
            className="btn-back"
          >
            ⬅ Volver
          </button>
          <h2>r/{group.name}</h2>
          <span className="members-count">👥 {group.members?.length || 0} miembros</span>
        </div>
        
        <p className="forum-desc">{group.desc}</p>

        <div className="forum-header-actions">
          <button 
            onClick={() => onToggleJoin(group.id)}
            className={`btn-join-header ${isJoined ? 'joined' : ''}`}
          >
            {isJoined ? '✓ Miembro' : 'Unirse a Comunidad'}
          </button>
          
          <button 
            onClick={() => setPantalla('groupChat')}
            className="btn-live-chat"
          >
            💬 Chat en Vivo
          </button>
        </div>
      </div>

      {/* Crear post si es miembro */}
      {isJoined ? (
        <form onSubmit={handleCrearPost} className="project-card create-post-card">
          <h3>Publicar en r/{group.name}</h3>
          <input 
            type="text" 
            placeholder="Título del post..." 
            value={nuevoPostTitulo}
            onChange={(e) => setNuevoPostTitulo(e.target.value)}
            required
            className="create-post-title"
          />
          <textarea 
            placeholder="¿De qué quieres hablar hoy con la comunidad?" 
            value={nuevoPostTexto}
            onChange={(e) => setNuevoPostTexto(e.target.value)}
            required
            rows="3"
            className="create-post-body"
          />
          {/* --- INPUT DE YOUTUBE --- */}
          <input 
            type="text" 
            placeholder="Enlace de YouTube (Opcional - ej: https://youtube.com/watch?v=...)" 
            value={nuevoPostYoutube}
            onChange={(e) => setNuevoPostYoutube(e.target.value)}
            className="create-post-title"
            style={{ marginTop: '10px', fontSize: '13px', borderColor: '#ff000044' }}
          />
          {/* ------------------------------- */}
          
          {/* --- NUEVO INPUT DE HASHTAGS --- */}
          <input 
            type="text" 
            placeholder="Tags separados por coma (ej: Hardware, PC, Dudas)" 
            value={nuevoPostTags}
            onChange={(e) => setNuevoPostTags(e.target.value)}
            className="create-post-title"
            style={{ marginTop: '10px', fontSize: '13px', borderColor: '#3b82f644' }}
          />
          {/* ------------------------------- */}
          
          <div className="create-post-footer">
            <button type="submit" className="btn-primary">Publicar</button>
          </div>
        </form>
      ) : (
        <div className="project-card join-notice-card" style={{ textAlign: 'center', padding: '20px' }}>
          <p>Debes unirte a **r/{group.name}** para poder publicar en esta comunidad.</p>
        </div>
      )}

      {/* Lista de Publicaciones */}
      {loading ? (
        <div className="loading-container">Cargando foro...</div>
      ) : publicaciones.length > 0 ? (
        publicaciones.map((post) => {
          const dioLike = post.usuariosLike?.includes(user);
          const estaAbierto = postAbierto[post.id];
          const isOwnPost = post.author === user;
          const isEditingPost = editingPostId === post.id;

          return (
            <div key={post.id} className="project-card reddit-post">
              <div className="card-header">
                <span className="post-author">Publicado por u/{post.author}</span>
                {isOwnPost && !isEditingPost && (
                  <div className="post-actions-menu">
                    <button className="btn-menu-edit" onClick={() => handleStartEditPost(post)}>✏️</button>
                    <button className="btn-menu-delete" onClick={() => handleDeletePost(post.id)}>🗑️</button>
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
                      <button onClick={() => handleSaveEditPost(post.id)} className="btn-save">Guardar</button>
                      <button onClick={() => setEditingPostId(null)} className="btn-cancel">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>{post.title}</h3>
                    <div className="post-forum-content">
                      {post.body}
                    </div>
                    
                    {/* --- BOTÓN PARA REDIRIGIR A DIRECTOS --- */}
                    {post.youtubeUrl && (
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
                    {/* --------------------------------------- */}
                  </>
                )}
              </div>

              <div className="card-footer">
                <button 
                  className="btn-action btn-like" 
                  onClick={() => handleLike(post.id)}
                  style={{ color: dioLike ? '#10b981' : 'inherit', fontWeight: dioLike ? 'bold' : 'normal' }}
                >
                  {dioLike ? '❤️ Apoyado' : '👍 Apoyar'} ({post.likes})
                </button>
                <button className="btn-action" onClick={() => toggleComentarios(post.id)}>
                  💬 Comentar ({post.comentarios?.length || 0})
                </button>
              </div>

              {estaAbierto && (
                <div className="comments-section">
                  <div className="comments-list">
                    {post.comentarios && post.comentarios.length > 0 ? (
                      post.comentarios.map((com) => {
                        const isOwnComment = com.autor === user;
                        const isEditingComment = editingCommentKey === `${post.id}-${com.id}`;

                        return (
                          <div key={com.id} className="comment-item">
                            <div className="comment-header">
                              <span className="comment-author">u/{com.autor}</span>
                              {isOwnComment && !isEditingComment && (
                                <div className="comment-opt-actions">
                                  <button onClick={() => handleStartEditComment(post.id, com)}>Editar</button>
                                  <button onClick={() => handleDeleteComment(post.id, com.id)}>Eliminar</button>
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
                                  <button onClick={() => handleSaveEditComment(post.id, com.id)}>✓</button>
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
                      <p className="no-comments-text">No hay comentarios aún.</p>
                    )}
                  </div>
                  {isJoined && (
                    <form onSubmit={(e) => handleAddComentario(e, post.id)} className="comment-form">
                      <input 
                        type="text" 
                        placeholder="Escribe un comentario..." 
                        value={nuevosComentarios[post.id] || ''}
                        onChange={(e) => handleInputChange(post.id, e.target.value)}
                        required
                      />
                      <button type="submit">Enviar</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="project-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Aún no hay publicaciones en r/{group.name}</h3>
          <p style={{ color: 'var(--text-muted)' }}>¡Inicia el debate creando el primer post!</p>
        </div>
      )}
    </main>
  );
}

export default GroupForum;