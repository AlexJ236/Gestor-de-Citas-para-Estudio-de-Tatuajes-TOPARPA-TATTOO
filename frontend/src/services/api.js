import axios from 'axios';
import { toast } from 'react-toastify';

// La variable de entorno VITE_API_URL será reemplazada por Vite durante el build.
// En desarrollo local, si no tienes un .env con VITE_API_URL, usará el valor por defecto.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log('API Base URL being used:', API_BASE_URL); // <-- ¡LOG ÚTIL PARA DEPURAR!

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// === Interceptor de Peticiones ===
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Error en interceptor de petición:', error);
    return Promise.reject(error);
  }
);

// === Interceptor de Respuestas ===
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.error(`Error de autenticación (${status}):`, error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Sesión inválida o expirada. Por favor, inicia sesión de nuevo.');
      sessionStorage.removeItem('authToken');
    } else if (status >= 500) {
      console.error(`Error del servidor (${status}):`, error.response?.data?.message || error.message);
      toast.error('Error interno del servidor. Inténtalo más tarde.');
    } else {
      console.warn(`Error en respuesta (${status || 'Network Error'}):`, error.response?.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;