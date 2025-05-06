import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// === Interceptor de Peticiones ===
apiClient.interceptors.request.use(
  (config) => {
    // Obtiene el token desde sessionStorage
    const token = sessionStorage.getItem('authToken');

    // Si existe el token, lo añade a la cabecera Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Devuelve la configuración modificada
    return config;
  },
  (error) => {
    // Maneja errores al configurar la petición
    console.error('Error en interceptor de petición:', error);
    return Promise.reject(error);
  }
);

// === Interceptor de Respuestas ===
// Para manejar errores globales como 401/403 o errores de servidor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;

    // Manejar error 401 (No autorizado) o 403 (Prohibido) - Token inválido/expirado/ausente
    if (status === 401 || status === 403) {
      console.error(`Error de autenticación (${status}):`, error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Sesión inválida o expirada. Por favor, inicia sesión de nuevo.');
      // Limpiar token local y redirigir (mejor si lo hace AuthContext o ProtectedRoute)
       sessionStorage.removeItem('authToken');
       // window.location.href = '/login'; // Recarga completa, o usar navigate si se pudiera
    }
    // Manejar errores de servidor (500 y superiores)
    else if (status >= 500) {
      console.error(`Error del servidor (${status}):`, error.response?.data?.message || error.message);
      toast.error('Error interno del servidor. Inténtalo más tarde.');
    }
    // Otros errores (ej. 400, 404) serán manejados usualmente por el componente que hizo la llamada
    // pero puedes loggearlos si quieres
    else {
        console.warn(`Error en respuesta (${status || 'Network Error'}):`, error.response?.data?.message || error.message);
    }

    // Rechaza la promesa para que el .catch() en el servicio o componente se active
    return Promise.reject(error);
  }
);


export default apiClient;