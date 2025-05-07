import apiClient from './api';
import { toast } from 'react-toastify';

/**
 * Obtiene la lista de todos los artistas desde el backend.
 * @returns {Promise<Array<{id: number, name: string}>>} - Array de objetos de artistas.
 */
export const getAllArtists = async () => {
  try {
    // Llama a GET /api/artists (el interceptor añade el token)
    const response = await apiClient.get('/artists');
    // Devuelve el array de artistas [{id: 1, name: 'Toparpa'}, ...]
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Error de red';
    // Mostrar error solo si no es un error de autenticación (manejado por interceptor)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error(`Error al cargar artistas: ${msg}`);
    }
    console.error('Error en servicio getAllArtists:', error.response?.data || error.message);
    throw error; // Propaga el error para que el componente sepa que falló
  }
};

// Aquí podrías añadir funciones para crear, actualizar o eliminar artistas si implementas esos endpoints
// export const createArtist = async (artistData) => { ... };
// export const updateArtist = async (id, artistData) => { ... };
// export const deleteArtist = async (id) => { ... };