import apiClient from './api';

// Función para obtener todos los clientes
export const getAllClients = async () => {
  try {
    const response = await apiClient.get('/clients');
    return response.data;
  } catch (error) {
    console.error('Error en servicio getAllClients:', error.response?.data || error.message);
    throw error;
  }
};

// Función para crear un nuevo cliente
export const createClient = async (clientData) => {
  try {
    const response = await apiClient.post('/clients', clientData);
    return response.data;
  } catch (error) {
    console.error('Error en servicio createClient:', error.response?.data || error.message);
    throw error;
  }
};

// Función para obtener un cliente por ID
export const getClientById = async (id) => {
  try {
    const response = await apiClient.get(`/clients/${id}`); // Llama a GET /api/clients/:id
    return response.data; // Devuelve los datos del cliente específico
  } catch (error) {
    console.error('Error en servicio getClientById:', error.response?.data || error.message);
    throw error;
  }
};

// Función para actualizar un cliente por ID
export const updateClient = async (id, clientData) => {
  try {
    // Llama a PUT /api/clients/:id con los nuevos datos
    const response = await apiClient.put(`/clients/${id}`, clientData);
    return response.data; // Devuelve el cliente actualizado por el backend
  } catch (error) {
    console.error('Error en servicio updateClient:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteClient = async (id) => {
  try {
    // Llama a DELETE /api/clients/:id
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data; // Devuelve el mensaje de éxito del backend
  } catch (error) {
    console.error('Error en servicio deleteClient:', error.response?.data || error.message);
    throw error; // Propaga el error para que el componente lo maneje
  }
};