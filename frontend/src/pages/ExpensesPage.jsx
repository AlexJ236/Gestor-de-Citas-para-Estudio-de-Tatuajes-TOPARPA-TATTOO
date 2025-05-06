import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllExpenses, deleteExpense } from '../services/expenseService'; // Usa servicio real
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css'; // Importar css de confirmAlert
import { format, parseISO, isValid } from 'date-fns';
import es from 'date-fns/locale/es';
import { Edit, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

// Helper para formatear moneda
const formatCurrency = (value) => {
  if (value == null || isNaN(Number(value))) return '$ 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar gastos
  const fetchExpenses = async () => {
    setLoading(true); setError(null);
    try {
      const data = await getAllExpenses(); // Llama al servicio real
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al cargar los gastos."); // Mensaje genérico, toast ya se mostró
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar gastos al montar
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Manejar eliminación
  const handleDelete = (expenseId, description) => {
    confirmAlert({
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de eliminar el gasto "${description || 'seleccionado'}"?`,
        buttons: [
            { label: 'Sí, Eliminar',
              onClick: async () => {
                try {
                    await deleteExpense(expenseId); // Llama al servicio real
                    // Actualizar estado local para reflejar eliminación
                    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
                    toast.success('Gasto eliminado.');
                } catch (err) { /* El servicio ya muestra toast de error */ }
              }
            },
            { label: 'No, Cancelar', onClick: () => {} }
        ],
        overlayClassName: "react-confirm-alert-overlay-dark" // Estilo opcional
    });
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
      try {
          const date = parseISO(dateString); // Asume formato ISO del backend
          if(isValid(date)) {
              return format(date, 'dd/MM/yyyy', { locale: es });
          }
      } catch {}
      return dateString; // Fallback al string original
  };

  return (
    <div>
      {/* Cabecera y Botón Añadir */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Gastos</h1>
        <Link to="/expenses/new" className="self-start sm:self-center">
           <button className="btn-primary flex items-center gap-2 w-full sm:w-auto">
               <PlusCircle size={18}/> Registrar Nuevo Gasto
           </button>
        </Link>
      </div>

      {/* Indicador de Carga */}
      {loading && <p className="text-text-secondary text-center py-10">Cargando gastos...</p>}

      {/* Mensaje de Error */}
      {error && !loading && (
          <div className="bg-red-900/30 border border-accent text-red-300 px-4 py-3 rounded relative mb-6 flex items-center" role="alert">
              <AlertCircle size={20} className="mr-2"/> <span>{error}</span>
          </div>
      )}

      {/* Mensaje si no hay gastos */}
      {!loading && !error && expenses.length === 0 && (
        <p className="text-center text-text-secondary py-10 bg-surface rounded-lg border border-border-color">No hay gastos registrados.</p>
      )}

      {/* Tabla de Gastos */}
      {!loading && !error && expenses.length > 0 && (
         <div className="bg-surface rounded-lg shadow-lg border border-border-color overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead className="border-b border-border-color bg-white/5"> {/* Fondo ligero cabecera */}
                    <tr>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Fecha</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Descripción</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Categoría</th>
                        <th className="p-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Monto</th>
                        <th className="p-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                    {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 whitespace-nowrap text-sm">{formatDate(exp.expense_date)}</td>
                            <td className="p-3 text-sm">{exp.description}</td>
                            <td className="p-3 text-sm text-text-secondary">{exp.category || '-'}</td>
                            <td className="p-3 text-right text-sm font-medium">{formatCurrency(exp.amount)}</td>
                            <td className="p-3 text-center whitespace-nowrap">
                                {/* Enlace Editar */}
                                <Link to={`/expenses/edit/${exp.id}`} className="mr-3 text-primary hover:text-primary-variant inline-block align-middle" title="Editar">
                                    <Edit size={16} />
                                </Link>
                                {/* Botón Eliminar */}
                                <button onClick={() => handleDelete(exp.id, exp.description)} className="text-accent hover:text-accent-hover inline-block align-middle" title="Eliminar">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      )}
    </div>
  );
}

export default ExpensesPage;