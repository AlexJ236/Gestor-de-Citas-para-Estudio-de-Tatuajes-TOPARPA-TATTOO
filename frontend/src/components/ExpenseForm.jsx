import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import CurrencyInput from 'react-currency-input-field';
import { toast } from 'react-toastify';
import { parseISO, format, isValid } from 'date-fns';

registerLocale('es', es);

const GASTO_CATEGORIAS = ['Alquiler', 'Materiales', 'Recibos', 'Otros'];

// --- Helper para obtener fecha inicial de forma segura ---
const getInitialDate = (dateString) => {
  // Si no hay fecha inicial (ej. al añadir), usar la fecha actual
  if (!dateString) return new Date();
  try {
    // Priorizar parseISO si viene de la DB
    let parsed = parseISO(dateString);
    if (isValid(parsed)) return parsed;

    // Intentar constructor estándar como fallback
    parsed = new Date(dateString);
    if (isValid(parsed)) return parsed;

  } catch (e) {
    console.error("Error parsing initial date:", e);
  }
  // Si todo falla, default a hoy y advertir
  console.warn("Formato de fecha inicial de gasto inválido, usando fecha actual:", dateString);
  return new Date();
};
// --- Fin Helper ---

function ExpenseForm({ initialData = {}, onSubmit, isSaving = false, submitButtonText = 'Guardar', onCancel }) {

  // --- Inicializar estado directamente usando el helper ---
  const [description, setDescription] = useState(initialData.description || '');
  const [amount, setAmount] = useState(initialData.amount?.toString() ?? '');
  const [category, setCategory] = useState(GASTO_CATEGORIAS.includes(initialData.category) ? initialData.category : '');
  // Inicializa el estado de la fecha UNA SOLA VEZ al montar, usando la función helper
  const [expenseDate, setExpenseDate] = useState(() => getInitialDate(initialData.expense_date));

  // --- useEffect simplificado: SOLO para resetear el form al *cambiar* el ID (modo edición) ---
  useEffect(() => {
    // No hacer nada en el montaje inicial si es para añadir (id es undefined)
    // Solo actualizar si estamos editando y el ID del gasto cambia
    if (initialData.id !== undefined) {
      setDescription(initialData.description || '');
      setAmount(initialData.amount?.toString() ?? '');
      setCategory(GASTO_CATEGORIAS.includes(initialData.category) ? initialData.category : '');
      // Actualizar la fecha solo si el ID cambia y hay una fecha inicial válida
      setExpenseDate(getInitialDate(initialData.expense_date));
    }

  }, [initialData?.id]); // Depender *solo* del ID para actualizaciones

  // Handlers
  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleAmountChange = (value) => setAmount(value === undefined ? '' : value);
  const handleCategoryChange = (e) => setCategory(e.target.value);
  // Asegurar que solo actualizamos con fechas válidas desde el DatePicker
  const handleDateChange = (date) => {
      if (date && isValid(date)) {
         setExpenseDate(date);
      } else {
          // Opcional: manejar selección inválida (ej. limpiar o no hacer nada)
           console.warn("DatePicker returned invalid date");
      }
  };

  const parseCurrencyToInt = (valueString) => {
    if (!valueString) return null;
    const digitsOnly = valueString.replace(/\D/g, '');
    if (!digitsOnly) return null;
    const parsed = parseInt(digitsOnly, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const handleInternalSubmit = (event) => {
    event.preventDefault();
    const numericAmount = parseCurrencyToInt(amount);

    if (!description.trim()) { toast.error('La descripción es requerida.'); return; }
    if (numericAmount === null || numericAmount <= 0) { toast.error('El monto debe ser un número positivo.'); return; }
    if (!category) { toast.error('Selecciona una categoría.'); return; }
    // Verificar que la fecha en el estado sea válida antes de formatear/enviar
    if (!expenseDate || !isValid(expenseDate)) { toast.error('La fecha del gasto es inválida.'); return; }

    const expenseData = {
      description: description.trim(),
      amount: numericAmount,
      category,
      expense_date: format(expenseDate, 'yyyy-MM-dd'), // Formatear solo si es válida
    };
    onSubmit(expenseData);
  };

  return (
    <form onSubmit={handleInternalSubmit} className="w-full sm:max-w-lg sm:mx-auto bg-surface p-4 sm:p-6 rounded-lg shadow-lg space-y-4 border border-border-color">
      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descripción:</label>
        <input type="text" id="description" value={description} onChange={handleDescriptionChange} required className="w-full" disabled={isSaving}/>
      </div>

      {/* Monto */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Monto:</label>
        <CurrencyInput
           id="amount" name="amount" placeholder="$ 50.000" required value={amount} decimalsLimit={0}
           prefix="$ " groupSeparator="." decimalSeparator="," className="w-full"
           onValueChange={handleAmountChange} disabled={isSaving} allowNegativeValue={false}
         />
      </div>

      {/* Categoría Select */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">Categoría:</label>
        <select id="category" value={category} onChange={handleCategoryChange} required className="w-full" disabled={isSaving} >
            <option value="">-- Selecciona una Categoría --</option>
            {GASTO_CATEGORIAS.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="expenseDate" className="block text-sm font-medium text-text-secondary mb-1">Fecha del Gasto:</label>
         <DatePicker
           id="expenseDate"
           // Pasar solo una fecha válida o null al DatePicker
           selected={expenseDate && isValid(expenseDate) ? expenseDate : null}
           onChange={handleDateChange}
           required
           dateFormat="dd/MM/yyyy" locale="es" placeholderText="Selecciona fecha"
           className="w-full" wrapperClassName="w-full" disabled={isSaving} autoComplete="off"
           showPopperArrow={true} popperPlacement="bottom-start"
         />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-3">
        {onCancel && ( <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary"> Cancelar </button> )}
        <button type="submit" disabled={isSaving} className="btn-primary"> {isSaving ? 'Guardando...' : submitButtonText} </button>
      </div>
    </form>
  );
}

ExpenseForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.string,
    expense_date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  onSubmit: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  submitButtonText: PropTypes.string,
  onCancel: PropTypes.func,
};

export default memo(ExpenseForm);