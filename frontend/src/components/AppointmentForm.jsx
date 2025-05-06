import React, { useState, useEffect, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { parseISO, getMinutes, getHours, setHours, setMinutes, isPast, isToday, isValid, startOfDay } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import CurrencyInput from 'react-currency-input-field';
import { getAllAppointments } from '../services/appointmentService';
import { toast } from 'react-toastify';

registerLocale('es', es);

// Helper para parsear el valor del CurrencyInput a un número entero (o null)
const parseCurrencyToInt = (valueString) => {
  if (!valueString) return null;
  // Quita todo excepto los dígitos (incluyendo puntos y comas de formato)
  const digitsOnly = valueString.replace(/\D/g, '');
  if (!digitsOnly) return null;
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? null : parsed;
};

function AppointmentForm({
  initialData = {}, onSubmit, isSaving = false, submitButtonText = 'Guardar',
  onCancel, clients = [], isLoadingClients = false
}) {
  const [clientId, setClientId] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [description, setDescription] = useState('');
  const [artist, setArtist] = useState('');
  // Mantener estado string para los inputs de moneda
  const [totalPriceString, setTotalPriceString] = useState();
  const [amountPaidString, setAmountPaidString] = useState();

  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [status, setStatus] = useState('scheduled');
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  // Efecto para poblar el formulario con datos iniciales o resetearlo
  useEffect(() => {
    setClientId(initialData.client_id || '');
    let initialDate = null;
    if (initialData.appointment_time) { try { const parsed = parseISO(initialData.appointment_time); if(isValid(parsed)) initialDate=parsed; } catch {} }
    setSelectedDateTime(initialDate);
    setDurationMinutes(initialData.duration_minutes?.toString() || '60');
    setDescription(initialData.description || '');
    setArtist(initialData.artist || '');
    // Convertir número a string para el input, manejar null/undefined
    setTotalPriceString(initialData.total_price != null ? String(initialData.total_price) : undefined);
    setAmountPaidString(initialData.amount_paid != null ? String(initialData.amount_paid) : undefined);
    setPaymentStatus(initialData.payment_status || 'pending');
    setStatus(initialData.status || 'scheduled');
    // Limpiar citas existentes al cambiar el initialData (para que se recarguen)
    setExistingAppointments([]);
  }, [initialData]); // Usar initialData como dependencia

  // Efecto para cargar citas existentes del día seleccionado
  useEffect(() => {
    if (!selectedDateTime || !isValid(selectedDateTime)) {
      setExistingAppointments([]);
      return;
    }
    let isMounted = true;
    const fetchAppointmentsForDate = async () => {
      setIsLoadingTimes(true);
      if(isMounted) setExistingAppointments([]); // Limpiar antes de cargar
      const targetDateStr = startOfDay(selectedDateTime).toISOString().split('T')[0]; // Formato YYYY-MM-DD

      try {
        const allAppointments = await getAllAppointments(); // Considerar pasar { date: targetDateStr } si la API soporta
        if (isMounted) {
          const appointmentsForDay = allAppointments.filter(appt => {
            if (initialData?.id && appt.id === initialData.id) return false; // Excluir la cita actual al editar
            try {
              const d = parseISO(appt.appointment_time);
              return isValid(d) && startOfDay(d).toISOString().split('T')[0] === targetDateStr;
            } catch { return false; }
          });
          setExistingAppointments(appointmentsForDay);
        }
      } catch (error) {
        if (isMounted) toast.error('Error cargando horarios disponibles.');
        console.error("Error fetching appointments for date:", error);
      } finally {
        if (isMounted) setIsLoadingTimes(false);
      }
    };
    fetchAppointmentsForDate();
    return () => { isMounted = false; };
  }, [selectedDateTime ? startOfDay(selectedDateTime).toISOString() : null, initialData?.id]);

  // Callback para filtrar tiempos en DatePicker
  const filterTime = useCallback((time) => {
    if (!selectedDateTime || !isValid(selectedDateTime)) return true; // Permitir si fecha no válida aún
    if (isLoadingTimes) return false; // No permitir selección mientras carga

    const proposedStartTime = setMinutes(setHours(startOfDay(selectedDateTime), getHours(time)), getMinutes(time));
    if (!isValid(proposedStartTime)) return false;

    const proposedEndTime = new Date(proposedStartTime.getTime() + (parseInt(durationMinutes, 10) || 60) * 60000);
    if (!isValid(proposedEndTime)) return false;

    // Verifica si el slot propuesto se solapa con alguna cita existente
    const isOccupied = existingAppointments.some(appt => {
      try {
        const existingStart = parseISO(appt.appointment_time);
        if (!isValid(existingStart)) return false;
        const existingDuration = appt.duration_minutes || 60;
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
        if (!isValid(existingEnd)) return false;

        // Hay solapamiento si:
        // (PropStart < ExistEnd) Y (PropEnd > ExistStart)
        return proposedStartTime < existingEnd && proposedEndTime > existingStart;

      } catch { return false; }
    });
    return !isOccupied;
  }, [selectedDateTime, existingAppointments, isLoadingTimes, durationMinutes]);

  // Handlers simples
  const handleClientChange = (e) => setClientId(e.target.value);
  const handleDurationChange = (e) => {
      const newDuration = e.target.value || '60';
      setDurationMinutes(newDuration);
      // Podríamos re-evaluar el tiempo seleccionado si la duración cambia y ahora choca
      // Pero por simplicidad, dejamos que el usuario re-seleccione si es necesario.
  };
  const handleArtistChange = (e) => setArtist(e.target.value);
  const handleDateTimeChange = (date) => setSelectedDateTime(date);
  const handlePaymentStatusChange = (e) => setPaymentStatus(e.target.value);
  const handleStatusChange = (e) => setStatus(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);

  // Handlers para CurrencyInput (mantienen el valor como string)
  const handleTotalPriceStringChange = (value) => setTotalPriceString(value);
  const handleAmountPaidStringChange = (value) => setAmountPaidString(value);

  // Handler para el submit del formulario
  const handleInternalSubmit = (event) => {
    event.preventDefault();

    // Validaciones básicas
    if (!clientId) { toast.error('Selecciona un cliente.'); return; }
    if (!selectedDateTime || !isValid(selectedDateTime)) { toast.error('Selecciona una fecha y hora válidas.'); return; }
    // Verificar si la hora seleccionada sigue siendo válida después de posibles cambios
    if (!filterTime(selectedDateTime)) { toast.error('La hora seleccionada está ocupada o no es válida con la duración actual.'); return; }
    if (isPast(selectedDateTime) && !isToday(selectedDateTime)) { toast.error('No puedes agendar citas en el pasado.'); return; }

    // Parsear valores de moneda usando el helper
    const numericTotalPrice = parseCurrencyToInt(totalPriceString);
    const numericAmountPaid = parseCurrencyToInt(amountPaidString) ?? 0; // Default a 0 si está vacío/inválido

    // Validar que el monto pagado no exceda el precio total
    if (numericTotalPrice !== null && numericAmountPaid > numericTotalPrice) {
      toast.error('El monto pagado no puede ser mayor al precio total.');
      return;
    }

    // Preparar datos para enviar
    const appointmentData = {
      client_id: parseInt(clientId, 10),
      appointment_time: selectedDateTime.toISOString(), // Formato estándar ISO 8601
      duration_minutes: parseInt(durationMinutes, 10) || 60,
      description: description.trim(),
      artist: artist.trim(),
      total_price: numericTotalPrice, // Valor entero o null
      amount_paid: numericAmountPaid, // Valor entero (nunca null, default 0)
      payment_status: paymentStatus,
      status: status,
    };

    // Llamar al onSubmit prop
    onSubmit(appointmentData);
  };

  // Función para className de DatePicker
  const getDayClassName = useCallback((date) => {
    if (isPast(date) && !isToday(date)) { return 'past-day'; }
    return '';
  }, []);

  // Deshabilitar formulario mientras guarda, carga clientes o verifica horarios
  const formDisabled = isSaving || isLoadingClients || isLoadingTimes;

  return (
    <form onSubmit={handleInternalSubmit} className="w-full sm:max-w-lg sm:mx-auto bg-surface p-4 sm:p-6 rounded-lg shadow-lg space-y-4 border border-border-color">
      {/* Cliente */}
      <div>
        <label htmlFor="client" className="block text-sm font-medium text-text-secondary mb-1">Cliente:</label>
        <select id="client" value={clientId} onChange={handleClientChange} required className="w-full" disabled={formDisabled || isLoadingClients} >
          <option value="">-- {isLoadingClients ? 'Cargando clientes...' : 'Selecciona un Cliente'} --</option>
          {Array.isArray(clients) && clients.map(client => (<option key={client.id} value={client.id}>{client.name} ({client.email || 'Sin email'})</option>))}
        </select>
        {isLoadingClients && <span className="text-xs text-amber-400 ml-2 animate-pulse">Cargando...</span>}
      </div>

      {/* Fecha y Hora */}
      <div>
        <label htmlFor="appointmentTime" className="block text-sm font-medium text-text-secondary mb-1">Fecha y Hora:</label>
        <DatePicker
          id="appointmentTime" selected={selectedDateTime} onChange={handleDateTimeChange} required showTimeSelect
          timeFormat="hh:mm aa" timeIntervals={15} dateFormat="Pp 'hrs.'" locale="es" placeholderText="Selecciona fecha y hora"
          className="w-full" wrapperClassName="w-full" disabled={formDisabled} autoComplete="off"
          minDate={new Date()} // Solo futuro y hoy
          showPopperArrow={true} popperPlacement="bottom-start" popperClassName="react-datepicker-popper z-50"
          filterTime={filterTime} dayClassName={getDayClassName} injectTimes={[ /* Puedes inyectar horas específicas si es necesario */ ]}
        />
         {isLoadingTimes && <span className="text-xs text-amber-400 ml-2 animate-pulse">Verificando disponibilidad...</span>}
         {!selectedDateTime && !formDisabled && !isLoadingTimes && <p className="text-xs text-text-secondary mt-1">Campo requerido.</p>}
         {selectedDateTime && !filterTime(selectedDateTime) && !isLoadingTimes && <p className="text-xs text-red-500 mt-1">Hora no disponible.</p>}
      </div>

      {/* Duración y Artista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-text-secondary mb-1">Duración (min):</label>
          <input type="number" id="duration" value={durationMinutes} onChange={handleDurationChange} placeholder="Ej: 60" className="w-full" disabled={formDisabled} min="15" step="15" required />
        </div>
        <div>
          <label htmlFor="artist" className="block text-sm font-medium text-text-secondary mb-1">Artista Asignado:</label>
          <input type="text" id="artist" value={artist} onChange={handleArtistChange} className="w-full" disabled={formDisabled}/>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descripción (Tatuaje/Idea):</label>
        <textarea id="description" value={description} onChange={handleDescriptionChange} rows="3" className="w-full" disabled={formDisabled}/>
      </div>

      {/* Precios y Pagos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="totalPrice" className="block text-sm font-medium text-text-secondary mb-1">Precio Total:</label>
          <CurrencyInput
            id="totalPrice" name="totalPrice" placeholder="$ 100.000" value={totalPriceString}
            decimalsLimit={0} prefix="$ " groupSeparator="." decimalSeparator=","
            className="w-full" onValueChange={handleTotalPriceStringChange}
            disabled={formDisabled} allowNegativeValue={false}
          />
        </div>
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-medium text-text-secondary mb-1">Monto Pagado:</label>
          <CurrencyInput
            id="amountPaid" name="amountPaid" placeholder="$ 50.000" value={amountPaidString}
            decimalsLimit={0} prefix="$ " groupSeparator="." decimalSeparator=","
            className="w-full" onValueChange={handleAmountPaidStringChange}
            disabled={formDisabled} allowNegativeValue={false}
          />
        </div>
      </div>

      {/* Estados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paymentStatus" className="block text-sm font-medium text-text-secondary mb-1">Estado Pago:</label>
          <select id="paymentStatus" value={paymentStatus} onChange={handlePaymentStatusChange} className="w-full" disabled={formDisabled}>
            <option value="pending">Pendiente</option>
            <option value="deposit_paid">Adelanto Pagado</option>
            <option value="fully_paid">Pagado Completo</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">Estado Cita:</label>
          <select id="status" value={status} onChange={handleStatusChange} className="w-full" disabled={formDisabled}>
            <option value="scheduled">Agendada</option>
            <option value="completed">Completada</option>
            <option value="canceled">Cancelada</option>
            <option value="no-show">No Asistió</option>
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-3">
        {onCancel && (<button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary"> Cancelar </button>)}
        <button type="submit" disabled={formDisabled} className="btn-primary">
          {isSaving ? 'Guardando...' : submitButtonText}
        </button>
      </div>
    </form>
  );
}

// PropTypes
AppointmentForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    client_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    appointment_time: PropTypes.string,
    duration_minutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    artist: PropTypes.string,
    total_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Acepta string o número
    amount_paid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Acepta string o número
    payment_status: PropTypes.string,
    status: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  submitButtonText: PropTypes.string,
  onCancel: PropTypes.func,
  clients: PropTypes.array.isRequired,
  isLoadingClients: PropTypes.bool,
};

export default memo(AppointmentForm);