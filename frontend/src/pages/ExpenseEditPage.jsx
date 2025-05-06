import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExpenseById, updateExpense } from '../services/expenseService';
import { toast } from 'react-toastify';
import ExpenseForm from '../components/ExpenseForm'; // Importar el formulario

function ExpenseEditPage() {
  const { id } = useParams(); // Obtener ID del gasto de la URL
  const navigate = useNavigate();
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadExpenseData = async () => {
      setLoading(true);
      try {
        const data = await getExpenseById(id);
        setExpenseData(data);
      } catch (err) {
        // El servicio ya muestra toast de error
        navigate('/expenses'); // Redirigir si no se encuentra o hay error
      } finally {
        setLoading(false);
      }
    };
    // Solo cargar si el ID es válido
    if (id) {
        loadExpenseData();
    } else {
        toast.error("ID de gasto inválido.");
        navigate('/expenses');
    }
  }, [id, navigate]); // Depender de id y navigate

  const handleUpdateExpense = async (updatedData) => {
    setIsSaving(true);
    try {
      await updateExpense(id, updatedData);
      toast.success('Gasto actualizado exitosamente!');
      navigate('/expenses');
    } catch (err) {
      // El servicio ya muestra toast de error
      setIsSaving(false); // Permitir reintentar
    }
  };

  if (loading) {
    return <p className="text-text-secondary text-center py-10">Cargando datos del gasto...</p>;
  }

  if (!expenseData) {
    // Ya se intentó redirigir o hubo error, mostrar mensaje simple
    return <p className="text-center text-accent">No se pudo cargar el gasto para editar.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Editar Gasto</h1>
      <ExpenseForm
        initialData={expenseData} // Pasar los datos cargados
        onSubmit={handleUpdateExpense}
        isSaving={isSaving}
        submitButtonText="Guardar Cambios"
        onCancel={() => navigate('/expenses')}
      />
    </div>
  );
}

export default ExpenseEditPage;