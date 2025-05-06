import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpense } from '../services/expenseService';
import { toast } from 'react-toastify';
import ExpenseForm from '../components/ExpenseForm'; // Importar el formulario

function ExpenseAddPage() {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleCreateExpense = async (expenseData) => {
    setIsSaving(true);
    try {
      await createExpense(expenseData);
      toast.success('Gasto registrado exitosamente!');
      navigate('/expenses'); // Volver a la lista después de crear
    } catch (err) {
       // El toast de error ya se maneja en el servicio
       setIsSaving(false); // Permitir reintentar si falla
    }
    // No poner setIsSaving(false) en éxito porque navegamos fuera
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Registrar Nuevo Gasto</h1>
      <ExpenseForm
        onSubmit={handleCreateExpense}
        isSaving={isSaving}
        submitButtonText="Registrar Gasto"
        onCancel={() => navigate('/expenses')} // Botón para cancelar
      />
    </div>
  );
}

export default ExpenseAddPage;