import apiClient from './api';
import { toast } from 'react-toastify';

/**
 * Obtiene el resumen financiero para un mes y año específicos desde el backend (para Dashboard).
 * @param {number} year Año (ej. 2025)
 * @param {number} month Mes (1-12)
 * @returns {Promise<object|null>} Objeto con { income, expenses, profit, pendingBalance } o null si hay error.
 */
export const getFinancialSummary = async (year, month) => {
  if (!year || !month || month < 1 || month > 12) {
      console.error("getFinancialSummary: Año y Mes son requeridos.");
      toast.error("Se requiere año y mes para cargar el resumen.");
      return null;
  }

  try {
    const params = { year, month };
    const response = await apiClient.get('/reports/summary', { params });
    return response.data; // ej. { income: 1000, expenses: 200, profit: 800, pendingBalance: 50 }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    if (status !== 401 && status !== 403 && status < 500) {
         toast.error(`Error al cargar resumen: ${message}`);
    }
    console.error(`Error en servicio getFinancialSummary (${status || 'Network Error'}): ${message}`);
    return null; // Devolver null para que el componente sepa que falló
  }
};

/**
 * Obtiene los datos detallados para un reporte diario.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {Promise<object|null>} Objeto con datos del reporte o null en caso de error.
 */
export const getDailyReportData = async (year, month, day) => {
    if (!year || !month || !day) {
        toast.error("Se requiere año, mes y día para el reporte diario.");
        return null;
    }
    try {
        const params = { year, month, day };
        const response = await apiClient.get('/reports/daily', { params });
        return response.data; // Devuelve { type, date, incomeDetails, expenseDetails, totals }
    } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        // Dejar que el interceptor maneje 401/403/500, mostrar toast para otros errores (ej. 400)
        if (status !== 401 && status !== 403 && status < 500) {
            toast.error(`Error al cargar datos del reporte diario: ${message}`);
        }
        console.error(`Error en servicio getDailyReportData (${status || 'Network Error'}): ${message}`); // Loguear siempre
        // Lanzar error para que el componente sepa que falló y detenga 'isGenerating'
        throw new Error(message || 'Error al obtener datos del reporte diario');
    }
};

/**
 * Obtiene los datos detallados para un reporte mensual.
 * @param {number} year
 * @param {number} month
 * @returns {Promise<object|null>} Objeto con datos del reporte o null en caso de error.
 */
export const getMonthlyReportData = async (year, month) => {
     if (!year || !month) {
         toast.error("Se requiere año y mes para el reporte mensual.");
         return null;
     }
     try {
         const params = { year, month };
         const response = await apiClient.get('/reports/monthly', { params });
         return response.data; // Devuelve { type, year, month, incomeDetails, expenseDetails, totals }
     } catch (error) {
         const status = error.response?.status;
         const message = error.response?.data?.message || error.message;
         // Dejar que el interceptor maneje 401/403/500, mostrar toast para otros errores (ej. 400)
         if (status !== 401 && status !== 403 && status < 500) {
             toast.error(`Error al cargar datos del reporte mensual: ${message}`);
         }
         console.error(`Error en servicio getMonthlyReportData (${status || 'Network Error'}): ${message}`); // Loguear siempre
         // Lanzar error para que el componente sepa que falló y detenga 'isGenerating'
         throw new Error(message || 'Error al obtener datos del reporte mensual');
     }
};