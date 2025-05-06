import apiClient from './api';

// Función para llamar al endpoint de login
export const loginUser = async (credentials) => {
  try {
    // Llama a POST /api/auth/login (axios añade 'auth/login' a la baseURL)
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // Devuelve los datos de la respuesta (ej. { token: '...' })
  } catch (error) {
    // Si hay un error (ej. 401 Unauthorized), lanza el error para que el componente lo maneje
    console.error('Error en servicio de login:', error.response?.data || error.message);
    throw error; // Propaga el error
  }
};

export const registerUser = async (userData) => {
 // TODO: Implementar llamada a /auth/register
};

// Exporta el cliente axios configurado por si se necesita en otros servicios
export default apiClient;