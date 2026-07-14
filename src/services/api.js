const API_BASE = 'https://redplus-backend-grupo-6-b6c5ftbsgbfmgubr.canadacentral-01.azurewebsites.net/api';
// --- BASE DE DATOS LOCAL DE RESPALDO (localStorage) ---
// Se activa automáticamente si el backend no está iniciado o es inalcanzable.
const localDb = {
  get(key, defaultVal) {
    const val = localStorage.getItem(`db_${key}`);
    return val ? JSON.parse(val) : defaultVal;
  },
  set(key, val) {
    localStorage.setItem(`db_${key}`, JSON.stringify(val));
  }
};

// Inicializar mock database en localStorage
if (!localDb.get('usuarios')) {
  localDb.set('usuarios', [
    { username: "usuario", password: "1234", bio: "Miembro Estudiante Universitario", avatar: "👤", habilities: ["React", "CSS", "Vite"] },
    { username: "carlos", password: "1234", bio: "r/HTML • Estudiante", avatar: "C", habilities: ["HTML", "CSS"] },
    { username: "ana", password: "1234", bio: "r/WebDev • Creadora", avatar: "A", habilities: ["React", "JavaScript"] },
    { username: "david", password: "1234", bio: "r/retrogaming • Moderador", avatar: "D", habilities: ["Retro Gaming", "Linux"] },
    { username: "laura", password: "1234", bio: "r/TechPeru • Diseñadora", avatar: "L", habilities: ["UI/UX", "Figma"] }
  ]);
}
if (!localDb.get('comunidades')) {
  localDb.set('comunidades', [
    { id: "frontend", name: "Frontend", desc: "Todo sobre React, UI/UX, CSS, Vite y maquetación web.", members: ["usuario", "carlos", "ana", "laura"] },
    { id: "backend", name: "Backend", desc: "Node.js, APIs, bases de datos y arquitectura de servidores.", members: ["ana"] },
    { id: "data", name: "Data Science", desc: "Python, Machine Learning, manejo de datos y estadísticas.", members: [] },
    { id: "redes", name: "Redes y TI", desc: "Infraestructura, servidores Linux, hardware y recuperación de datos.", members: ["usuario", "david"] }
  ]);
}
if (!localDb.get('posts')) {
  localDb.set('posts', [
    {
      id: 1,
      author: "carlos",
      communityId: "frontend",
      title: "Proyecto de Frontend Avanzado",
      body: "Gente, avanzamos la estructura principal del foro para la entrega. Dejo los componentes base listos para revisión grupal.",
      likes: 15,
      usuariosLike: [],
      comentarios: [
        { id: 101, autor: "ana", texto: "Buenísimo el avance, los estilos se ven muy modernos." },
        { id: 102, autor: "usuario", texto: "¡Quedó excelente! Yo adminto los hooks hoy." }
      ]
    },
    {
      id: 2,
      author: "usuario",
      communityId: "frontend",
      title: "Duda con useEffect en React",
      body: "¿Alguien sabe por qué se duplica el renderizado al cargar datos simulados de la lista de tendencias?",
      likes: 3,
      usuariosLike: ["ana"],
      comentarios: [
        { id: 103, autor: "ana", texto: "Se debe al React.StrictMode en main.jsx en desarrollo. Es normal." }
      ]
    },
    {
      id: 3,
      author: "david",
      communityId: "redes",
      title: "Guía para rescatar datos de discos dañados (Toshiba)",
      body: "Acabo de hacer un clonado exitoso hacia un disco secundario. Recomiendo muchísimo bootear en Fedora y ejecutar ddrescue por consola. Me saltó varios sectores defectuosos pero salvó casi toda la estructura de archivos.",
      likes: 8,
      usuariosLike: ["usuario"],
      comentarios: [
        { id: 104, autor: "usuario", texto: "Buenísimo el dato de ddrescue, te salva la vida." }
      ]
    }
  ]);
}
if (!localDb.get('mensajes')) {
  localDb.set('mensajes', [
    { id: 1, senderId: "carlos", receiverId: "usuario", text: "¡Hola! ¿Pudiste revisar los componentes para la entrega grupal?", time: "10:30" },
    { id: 2, senderId: "ana", receiverId: "usuario", text: "¿Qué tal va el muro de proyectos? ¡Se ve increíble!", time: "10:45" },
    { id: 3, senderId: "david", receiverId: "usuario", text: "¡El fin de semana organizamos torneo de juegos clásicos. ¿Te apuntas?", time: "Ayer" },
    { id: 4, senderId: "laura", receiverId: "usuario", text: "Vi tu publicación sobre React. ¡Muy buena explicación!", time: "Hace 2 días" }
  ]);
}
if (!localDb.get('recientes')) {
  localDb.set('recientes', {
    usuario: ["frontend", "redes"]
  });
}
if (!localDb.get('groupChats')) {
  localDb.set('groupChats', {});
}

// Bandera para advertir en consola que el backend está caído
let backendWarningShown = false;

// Realizar la petición API, si falla por red o estado 5xx/502/504 redirige al fallback
async function request(url, options = {}, fallbackAction) {
  try {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const config = { ...options, headers };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE}${url}`, config);
    
    // Si es un error de cliente (4xx) del backend real, retornar el error correctamente
    if (response.status >= 400 && response.status < 500) {
      const errData = await response.json().catch(() => ({ message: 'Error del servidor.' }));
      throw new Error(errData.message || `Error ${response.status}`);
    }

    // Si es un error de servidor (5xx) o proxy caído (502/504), usar fallback
    if (!response.ok) {
      throw new Error(`Servidor inalcanzable (status ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    // Si el error es de red (fetch falló) o 5xx, intentar fallback local
    // Si el error ya viene de un 4xx real, re-lanzarlo sin usar fallback
    const isRealApiError = error.message && !error.message.includes('Servidor inalcanzable') && !error.message.includes('Failed to fetch') && !error.message.includes('fetch');
    
    if (isRealApiError) {
      throw error; // Error real de la API (ej: usuario ya existe, comunidad duplicada)
    }

    if (!backendWarningShown) {
      console.warn("⚠️ El servidor backend de RedPlus no está activo o es inalcanzable. Se ha activado la persistencia local de respaldo (localStorage) automáticamente.");
      backendWarningShown = true;
    }
    
    // Ejecutar lógica de respaldo local
    if (fallbackAction) {
      return fallbackAction();
    }
    throw error;
  }
}


export const api = {
  // --- USUARIOS ---
  login: (username, password) => 
    request('/users/login', { method: 'POST', body: { username, password } }, () => {
      const users = localDb.get('usuarios', []);
      const user = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );
      if (user) {
        return { success: true, user };
      } else {
        throw new Error('Usuario o contraseña incorrectos.');
      }
    }),

  register: (username, password) => 
    request('/users/register', { method: 'POST', body: { username, password } }, () => {
      const users = localDb.get('usuarios', []);
      if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
        throw new Error('El usuario ya existe.');
      }
      const newUser = {
        username: username.trim(),
        password,
        bio: '¡Hola! Soy nuevo en RedPlus.',
        avatar: '👤',
        habilities: []
      };
      users.push(newUser);
      localDb.set('usuarios', users);
      return { success: true, user: newUser };
    }),

  getUsers: () => 
    request('/users', {}, () => {
      const users = localDb.get('usuarios', []);
      return users.map(({ username, bio, avatar, habilities }) => ({
        username, bio, avatar, habilities
      }));
    }),

  updateProfile: (profile) => 
    request('/users/profile', { method: 'PUT', body: profile }, () => {
      const users = localDb.get('usuarios', []);
      const index = users.findIndex(u => u.username === profile.username);
      if (index !== -1) {
        users[index] = { ...users[index], ...profile };
        localDb.set('usuarios', users);
        return { success: true, user: users[index] };
      }
      throw new Error('Usuario no encontrado.');
    }),

  // --- POSTS ---
  //Buscador
search: (query) => 
    request(`/search?q=${encodeURIComponent(query)}`, {}, () => {
      const posts = localDb.get('posts', []);
      const q = query.toLowerCase();
      return posts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.body.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }),

  getPosts: () => 
    request('/posts', {}, () => {
      return localDb.get('posts', []);
    }),

  getTrends: () => 
    request('/trends', {}, () => {
      return []; 
    }),
  
  getStreams: () => 
    request('/streams', {}, () => {
      const posts = localDb.get('posts', []);
      return posts.filter(p => p.youtubeUrl);
    }),

  createPost: (author, title, body, communityId, youtubeUrl = null, tags = []) =>
    request('/posts', { method: 'POST', body: { author, title, body, communityId, youtubeUrl, tags } }, () => {
      const posts = localDb.get('posts', []);
      const newPost = {
        id: Date.now(),
        author,
        communityId: communityId || 'general',
        title,
        body,
        likes: 0,
        usuariosLike: [],
        comentarios: []
      };
      posts.unshift(newPost);
      localDb.set('posts', posts);
      return { success: true, post: newPost };
    }),

  updatePost: (id, title, body) => 
    request(`/posts/${id}`, { method: 'PUT', body: { title, body } }, () => {
      const posts = localDb.get('posts', []);
      const index = posts.findIndex(p => p.id === parseInt(id));
      if (index !== -1) {
        posts[index].title = title;
        posts[index].body = body;
        localDb.set('posts', posts);
        return { success: true, post: posts[index] };
      }
      throw new Error('Publicación no encontrada.');
    }),

  deletePost: (id) => 
    request(`/posts/${id}`, { method: 'DELETE' }, () => {
      let posts = localDb.get('posts', []);
      posts = posts.filter(p => p.id !== parseInt(id));
      localDb.set('posts', posts);
      return { success: true };
    }),

  likePost: (id, username) => 
    request(`/posts/${id}/like`, { method: 'POST', body: { username } }, () => {
      const posts = localDb.get('posts', []);
      const post = posts.find(p => p.id === parseInt(id));
      if (post) {
        if (!post.usuariosLike) post.usuariosLike = [];
        const idx = post.usuariosLike.indexOf(username);
        if (idx === -1) {
          post.usuariosLike.push(username);
          post.likes += 1;
        } else {
          post.usuariosLike.splice(idx, 1);
          post.likes -= 1;
        }
        localDb.set('posts', posts);
        return { success: true, post };
      }
      throw new Error('Publicación no encontrada.');
    }),

  // --- COMENTARIOS ---
  addComment: (postId, autor, texto) => 
    request(`/posts/${postId}/comments`, { method: 'POST', body: { autor, texto } }, () => {
      const posts = localDb.get('posts', []);
      const post = posts.find(p => p.id === parseInt(postId));
      if (post) {
        const newComment = { id: Date.now(), autor, texto };
        if (!post.comentarios) post.comentarios = [];
        post.comentarios.push(newComment);
        localDb.set('posts', posts);
        return { success: true, comment: newComment, post };
      }
      throw new Error('Publicación no encontrada.');
    }),

  updateComment: (postId, commentId, texto) => 
    request(`/posts/${postId}/comments/${commentId}`, { method: 'PUT', body: { texto } }, () => {
      const posts = localDb.get('posts', []);
      const post = posts.find(p => p.id === parseInt(postId));
      if (post) {
        const comment = post.comentarios.find(c => c.id === parseInt(commentId));
        if (comment) {
          comment.texto = texto;
          localDb.set('posts', posts);
          return { success: true, comment, post };
        }
      }
      throw new Error('Error al actualizar el comentario.');
    }),

  deleteComment: (postId, commentId) => 
    request(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }, () => {
      const posts = localDb.get('posts', []);
      const post = posts.find(p => p.id === parseInt(postId));
      if (post) {
        post.comentarios = post.comentarios.filter(c => c.id !== parseInt(commentId));
        localDb.set('posts', posts);
        return { success: true, post };
      }
      throw new Error('Error al eliminar comentario.');
    }),

  // --- COMUNIDADES ---
  getCommunities: () => 
    request('/communities', {}, () => {
      return localDb.get('comunidades', []);
    }),

  createCommunity: (id, name, desc) => 
    request('/communities', { method: 'POST', body: { id, name, desc } }, () => {
      const comms = localDb.get('comunidades', []);
      if (comms.some(c => c.id === id || c.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('La comunidad ya existe.');
      }
      const newComm = { id, name, desc, members: [] };
      comms.push(newComm);
      localDb.set('comunidades', comms);
      return { success: true, community: newComm };
    }),

  joinCommunity: (id, username) => 
    request(`/communities/${id}/join`, { method: 'POST', body: { username } }, () => {
      const comms = localDb.get('comunidades', []);
      const comm = comms.find(c => c.id === id);
      if (comm) {
        if (!comm.members) comm.members = [];
        const idx = comm.members.indexOf(username);
        if (idx === -1) {
          comm.members.push(username);
        } else {
          comm.members.splice(idx, 1);
        }
        localDb.set('comunidades', comms);
        return { success: true, community: comm };
      }
      throw new Error('Comunidad no encontrada.');
    }),

  // --- MENSAJES PRIVADOS ---
  getMessages: (user) => 
    request(`/messages?user=${encodeURIComponent(user)}`, {}, () => {
      const msgs = localDb.get('mensajes', []);
      return msgs.filter(m => m.senderId === user || m.receiverId === user);
    }),

  sendMessage: (senderId, receiverId, text) => 
    request('/messages', { method: 'POST', body: { senderId, receiverId, text } }, () => {
      const msgs = localDb.get('mensajes', []);
      const newMsg = {
        id: Date.now(),
        senderId,
        receiverId,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      msgs.push(newMsg);
      localDb.set('mensajes', msgs);
      return { success: true, message: newMsg };
    }),

  updateMessage: (id, text) => 
    request(`/messages/${id}`, { method: 'PUT', body: { text } }, () => {
      const msgs = localDb.get('mensajes', []);
      const msg = msgs.find(m => m.id === parseInt(id));
      if (msg) {
        msg.text = text;
        localDb.set('mensajes', msgs);
        return { success: true, message: msg };
      }
      throw new Error('Mensaje no encontrado.');
    }),

  deleteMessage: (id) => 
    request(`/messages/${id}`, { method: 'DELETE' }, () => {
      let msgs = localDb.get('mensajes', []);
      msgs = msgs.filter(m => m.id !== parseInt(id));
      localDb.set('mensajes', msgs);
      return { success: true };
    }),

  // --- RECIENTES ---
  getRecientes: (username) => 
    request(`/recientes/${encodeURIComponent(username)}`, {}, () => {
      const rec = localDb.get('recientes', {});
      return rec[username] || [];
    }),

  addReciente: (username, communityId) => 
    request(`/recientes/${encodeURIComponent(username)}`, { method: 'POST', body: { communityId } }, () => {
      const rec = localDb.get('recientes', {});
      if (!rec[username]) rec[username] = [];
      let list = rec[username].filter(id => id !== communityId);
      list.unshift(communityId);
      rec[username] = list.slice(0, 5);
      localDb.set('recientes', rec);
      return { success: true, recientes: rec[username] };
    }),

  // --- CHATS DE GRUPO ---
  getGroupChats: (groupId) => 
    request(`/groups/${groupId}/chats`, {}, () => {
      const chats = localDb.get('groupChats', {});
      return chats[groupId] || [
        { id: 1, emisor: 'System', texto: `¡Bienvenidos al canal de ${groupId}! Reglas: Respeto y compartir código.` }
      ];
    }),

  sendGroupChat: (groupId, emisor, texto) => 
    request(`/groups/${groupId}/chats`, { method: 'POST', body: { emisor, texto } }, () => {
      const chats = localDb.get('groupChats', {});
      if (!chats[groupId]) chats[groupId] = [];
      const newMsg = {
        id: Date.now(),
        emisor,
        texto,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      chats[groupId].push(newMsg);
      localDb.set('groupChats', chats);
      return { success: true, message: newMsg };
    })
    
};
