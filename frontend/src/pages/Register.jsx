import { useState } from 'react';
import { api } from '../services/api';

function Register({ setEsLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    try {
      await api.register(username.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        setEsLogin(true); // Redirigir al login tras 2 segundos
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al registrar el usuario.');
    }
  };

  return (
    <div className="login-box">
      <form onSubmit={handleSubmit}>
        <h2>Crear Cuenta</h2>
        
        {error && <p className="error">{error}</p>}
        {success && <p className="success" style={{ color: '#10b981', fontSize: '14px', marginBottom: '10px' }}>¡Registro exitoso! Redirigiendo...</p>}

        <input 
          type="text" 
          placeholder="Nombre de Usuario" 
          value={username}
          onChange={e => setUsername(e.target.value)} 
          required 
          disabled={success}
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
          required 
          disabled={success}
        />
        <input 
          type="password" 
          placeholder="Confirmar Contraseña" 
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} 
          required 
          disabled={success}
        />

        <button type="submit" disabled={success} style={{ opacity: success ? 0.7 : 1 }}>
          Registrarse
        </button>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '15px' }}>
          ¿Ya tienes cuenta?{' '}
          <span 
            onClick={() => !success && setEsLogin(true)} 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Inicia sesión aquí
          </span>
        </p>
      </form>
    </div>
  );
}

export default Register;