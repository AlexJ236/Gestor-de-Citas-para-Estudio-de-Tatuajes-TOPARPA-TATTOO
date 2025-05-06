import apiClient from './api';
import { toast } from 'react-toastify';

// --- Funciones CRUD para Gastos ---

export const getAllExpenses = async (filters = {}) => {
  try {
    const response = await apiClient.get('/expenses', { params: filters });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Error de red';
    console.error('Error en servicio getAllExpenses:', msg);
    toast.error(`Error al cargar gastos: ${msg}`);
    throw error; // Relanzar para manejo en componente si es necesario
  }
};

export const getExpenseById = async (id) => {
   try {
     const response = await apiClient.get(`/expenses/${id}`);
     return response.data;
   } catch (error) {
     const msg = error.response?.data?.message || 'Error de red';
     console.error('Error en servicio getExpenseById:', msg);
     toast.error(`Error al cargar gasto: ${msg}`);
     throw error;
   }
};


export const createExpense = async (expenseData) => {
  try {
    const response = await apiClient.post('/expenses', expenseData);
    return response.data; // El backend devuelve el gasto creado
  } catch (error) {
    const msg = error.response?.data?.message || 'Error de red';
    console.error('Error en servicio createExpense:', msg);
    toast.error(`Error al crear gasto: ${msg}`);
    throw error;
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    // console.log(`Updating expense ${id}:`, expenseData); // Log opcional
     const response = await apiClient.put(`/expenses/${id}`, expenseData);
     return response.data; // El backend devuelve el gasto actualizado
  } catch (error) {
    const msg = error.response?.data?.message || 'Error de red';
    console.error('Error en servicio updateExpense:', msg);
    toast.error(`Error al actualizar gasto: ${msg}`);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    const response = await apiClient.delete(`/expenses/${id}`);

    return response.data; // El backend devuelve { message: '...' }
  } 
  catch (error) {
    const msg = error.response?.data?.message || 'Error de red';
    console.error('Error en servicio deleteExpense:', msg);
    toast.error(`Error al eliminar gasto: ${msg}`);
    throw error;
  }
};