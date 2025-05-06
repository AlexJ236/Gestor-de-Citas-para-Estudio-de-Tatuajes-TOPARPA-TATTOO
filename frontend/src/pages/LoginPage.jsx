import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify'; // <-- IMPORTAR

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser({ username, password });
      console.log('Login exitoso, token recibido:', data.token);
      login(data.token);
      // Opcional: Mostrar un toast de bienvenida aunque naveguemos
      // toast.success('¡Bienvenido!');
      navigate('/');

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
      toast.error(errorMessage); // <-- USAR TOAST EN LUGAR DE setError
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleSubmit}>
        {/* ... (inputs de usuario y contraseña sin cambios) ... */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username">Usuario:</label><br />
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password">Contraseña:</label><br />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>

        {/* Eliminamos el párrafo de error local */}
        {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}

        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;