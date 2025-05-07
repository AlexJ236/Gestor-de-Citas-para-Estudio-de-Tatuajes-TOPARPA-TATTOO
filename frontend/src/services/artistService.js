import apiClient from './api';
import { toast } from 'react-toastify';

const handleApiError = (error, context = 'operación') => {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || `Error de red al realizar la ${context}.`;
  console.error(`Error en servicio de artistas (${context}, status ${status || 'N/A'}):`, message);
  if (status && status !== 401 && status !== 403 && status < 500) {
    toast.error(`Error en ${context}: ${message}`);
  }
  throw error;
};

export const getAllArtists = async () => {
  try {
    const response = await apiClient.get('/artists');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'obtener artistas');
  }
};

export const createArtist = async (artistData) => {
  try {
    const response = await apiClient.post('/artists', artistData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'crear artista');
  }
};

export const updateArtist = async (id, artistData) => {
  try {
    const response = await apiClient.put(`/artists/${id}`, artistData);
    return response.data;
  } catch (error) {
    return handleApiError(error, `actualizar artista ${id}`);
  }
};

export const deleteArtist = async (id) => {
  try {
    const response = await apiClient.delete(`/artists/${id}`);
    return response.data; // Devuelve { message: '...' }
  } catch (error) {
    return handleApiError(error, `eliminar artista ${id}`);
  }
};