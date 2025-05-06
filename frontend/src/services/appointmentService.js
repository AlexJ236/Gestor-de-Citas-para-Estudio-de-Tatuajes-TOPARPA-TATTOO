import apiClient from './api';

export const getAllAppointments = async () => {
  try {
    // Llama a GET /api/appointments
    // El interceptor en apiClient añadirá el token automáticamente
    const response = await apiClient.get('/appointments');
    return response.data; // Devuelve el array de citas (con client_name incluido)
  } catch (error) {
    console.error('Error en servicio getAllAppointments:', error.response?.data || error.message);
    throw error; // Propaga el error
  }
};

export const createAppointment = async (appointmentData) => {
    try {
      // Llama a POST /api/appointments con los datos de la nueva cita
      const response = await apiClient.post('/appointments', appointmentData);
      return response.data; // Devuelve la cita recién creada
    } catch (error) {
      console.error('Error en servicio createAppointment:', error.response?.data || error.message);
      throw error;
    }
  };
  
  export const getAppointmentById = async (id) => {
    try {
      const response = await apiClient.get(`/appointments/${id}`); // Llama a GET /api/appointments/:id
      return response.data;
    } catch (error) {
      console.error('Error en servicio getAppointmentById:', error.response?.data || error.message);
      throw error;
    }
  };
  
  export const updateAppointment = async (id, appointmentData) => {
    try {
      // Llama a PUT /api/appointments/:id con los nuevos datos
      const response = await apiClient.put(`/appointments/${id}`, appointmentData);
      return response.data; // Devuelve la cita actualizada
    } catch (error) {
      console.error('Error en servicio updateAppointment:', error.response?.data || error.message);
      throw error;
    }
  };

  export const deleteAppointment = async (id) => {
    try {
      // Llama a DELETE /api/appointments/:id
      const response = await apiClient.delete(`/appointments/${id}`);
      return response.data; // Devuelve el mensaje de éxito del backend
    } catch (error) {
      console.error('Error en servicio deleteAppointment:', error.response?.data || error.message);
      throw error;
    }
  };