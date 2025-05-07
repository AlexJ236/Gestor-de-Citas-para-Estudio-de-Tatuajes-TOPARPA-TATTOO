import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { parseISO, getMinutes, getHours, setHours, setMinutes, isPast, isToday, isValid, startOfDay } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import CurrencyInput from 'react-currency-input-field';
import { getAllAppointments } from '../services/appointmentService';
import { getAllArtists } from '../services/artistService';
import { toast } from 'react-toastify';

registerLocale('es', es);

// Helper para parsear moneda a entero
const parseCurrencyToInt = (valueString) => {
  if (!valueString) return null;
  const digitsOnly = valueString.replace(/\D/g, '');
  if (!digitsOnly) return null;
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? null : parsed;
};

function AppointmentForm({
  initialData = {}, onSubmit, isSaving = false, submitButtonText = 'Guardar',
  onCancel, clients = [], isLoadingClients = false
}) {
  // Estados del formulario
  const [clientId, setClientId] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [description, setDescription] = useState('');
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [totalPriceString, setTotalPriceString] = useState();
  const [amountPaidString, setAmountPaidString] = useState();
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [status, setStatus] = useState('scheduled');

  // Estados de carga y datos auxiliares
  const [existingAppointments, setExistingAppointments] = useState([]); // Citas para verificar conflictos
  const [isLoadingTimes, setIsLoadingTimes] = useState(false); // Cargando horarios ocupados
  const [artists, setArtists] = useState([]); // Lista de artistas
  const [isLoadingArtists, setIsLoadingArtists] = useState(true); // Cargando artistas

  // Efecto para poblar el formulario con datos iniciales o resetearlo
  useEffect(() => {
    setClientId(initialData.client_id || '');
    let initialDate = null;
    if (initialData.appointment_time) { try { const parsed = parseISO(initialData.appointment_time); if(isValid(parsed)) initialDate=parsed; } catch {} }
    setSelectedDateTime(initialDate);
    setDurationMinutes(initialData.duration_minutes?.toString() || '60');
    setDescription(initialData.description || '');
    setSelectedArtistId(initialData.artist_id || '');
    setTotalPriceString(initialData.total_price != null ? String(initialData.total_price) : undefined);
    setAmountPaidString(initialData.amount_paid != null ? String(initialData.amount_paid) : undefined);
    setPaymentStatus(initialData.payment_status || 'pending');
    setStatus(initialData.status || 'scheduled');
    setExistingAppointments([]);
  }, [initialData]); // Usar initialData como dependencia

  // Efecto para cargar la lista de artistas -->
  useEffect(() => {
    let isMounted = true;
    const fetchArtists = async () => {
        setIsLoadingArtists(true);
        try {
            const data = await getAllArtists(); // Llamar al nuevo servicio
            if (isMounted) {
                setArtists(Array.isArray(data) ? data : []);
            }
        } catch (error) {
             // El servicio ya muestra toast si no es error de autenticación
            if (isMounted) setArtists([]); // Dejar lista vacía si hay error
            console.error("Error cargando artistas en formulario:", error);
        } finally {
            if (isMounted) setIsLoadingArtists(false);
        }
    };
    fetchArtists();
    return () => { isMounted = false; };
  }, []); // Solo se ejecuta al montar el componente

  // Efecto para cargar citas existentes del día y artista seleccionado (para conflictos)
  useEffect(() => {
    // No cargar si no hay fecha válida o artista seleccionado
    if (!selectedDateTime || !isValid(selectedDateTime) || !selectedArtistId) {
      setExistingAppointments([]);
      return;
    }

    let isMounted = true;
    const fetchAppointmentsForDateTimeArtist = async () => {
      setIsLoadingTimes(true);
      if(isMounted) setExistingAppointments([]); // Limpiar antes de cargar

      const targetDate = startOfDay(selectedDateTime); // Fecha seleccionada

      try {
        // Como getAllAppointments trae todo, filtramos aquí:
        const allAppointments = await getAllAppointments();
        if (isMounted) {
          const appointmentsForDayAndArtist = allAppointments.filter(appt => {
            // Excluir la cita actual si estamos editando
            if (initialData?.id && appt.id === initialData.id) return false;
            // Excluir citas canceladas
            if (appt.status === 'canceled') return false;
            // Verificar si es del mismo artista
            if (appt.artist_id !== parseInt(selectedArtistId, 10)) return false;
            // Verificar si es del mismo día
            try {
              const d = parseISO(appt.appointment_time);
              return isValid(d) && startOfDay(d).getTime() === targetDate.getTime();
            } catch { return false; }
          });
          setExistingAppointments(appointmentsForDayAndArtist);
        }
      } catch (error) {
        if (isMounted) toast.error('Error cargando horarios disponibles.');
        console.error("Error fetching appointments for date/artist check:", error);
      } finally {
        if (isMounted) setIsLoadingTimes(false);
      }
    };

    fetchAppointmentsForDateTimeArtist();
    return () => { isMounted = false; };
  // Depender de la fecha (solo día) y del artista seleccionado
  }, [selectedDateTime ? startOfDay(selectedDateTime).toISOString() : null, selectedArtistId, initialData?.id]);

  // Callback para filtrar tiempos en DatePicker
  const filterTime = useCallback((time) => {
    if (!selectedDateTime || !isValid(selectedDateTime) || !selectedArtistId) return true; // Permitir si fecha/artista no válidos aún
    if (isLoadingTimes) return false; // No permitir selección mientras carga conflictos

    const proposedStartTime = setMinutes(setHours(startOfDay(selectedDateTime), getHours(time)), getMinutes(time));
    if (!isValid(proposedStartTime)) return false;

    const currentDuration = parseInt(durationMinutes, 10) || 60;
    const proposedEndTime = new Date(proposedStartTime.getTime() + currentDuration * 60000);
    if (!isValid(proposedEndTime)) return false;

    // Verifica si el slot propuesto se solapa con alguna cita existente PARA ESE ARTISTA
    const isOccupied = existingAppointments.some(appt => {
       if (!appt.appointment_time || !appt.duration_minutes) return false;
       try {
           const existingStart = parseISO(appt.appointment_time);
           if (!isValid(existingStart)) return false;
           const existingDuration = appt.duration_minutes;
           const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
           if (!isValid(existingEnd)) return false;

           // Lógica de solapamiento: (InicioProp < FinExist) Y (FinProp > InicioExist)
           return proposedStartTime < existingEnd && proposedEndTime > existingStart;
       } catch {
           console.error("Error parsing existing appointment time during filter:", appt);
           return false; // Ignorar cita existente si no se puede parsear
       }
    });

    return !isOccupied; // Permitir si NO está ocupado
  }, [selectedDateTime, existingAppointments, isLoadingTimes, durationMinutes, selectedArtistId]);

  // Handlers de cambio
  const handleClientChange = (e) => setClientId(e.target.value);
  const handleDurationChange = (e) => setDurationMinutes(e.target.value || '60');
  const handleArtistChange = (e) => setSelectedArtistId(e.target.value); // <-- NUEVO
  const handleDateTimeChange = (date) => setSelectedDateTime(date);
  const handlePaymentStatusChange = (e) => setPaymentStatus(e.target.value);
  const handleStatusChange = (e) => setStatus(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleTotalPriceStringChange = (value) => setTotalPriceString(value);
  const handleAmountPaidStringChange = (value) => setAmountPaidString(value);

  // Handler para el submit
  const handleInternalSubmit = (event) => {
    event.preventDefault();

    // Validaciones
    if (!clientId) { toast.error('Selecciona un cliente.'); return; }
    if (!selectedArtistId) { toast.error('Selecciona un artista.'); return; } // <-- NUEVO
    if (!selectedDateTime || !isValid(selectedDateTime)) { toast.error('Selecciona una fecha y hora válidas.'); return; }
    if (!filterTime(selectedDateTime)) { toast.error('La hora seleccionada está ocupada para este artista o no es válida con la duración actual.'); return; }

    const numericTotalPrice = parseCurrencyToInt(totalPriceString);
    const numericAmountPaid = parseCurrencyToInt(amountPaidString) ?? 0;

    if (numericTotalPrice !== null && numericAmountPaid > numericTotalPrice) {
      toast.error('El monto pagado no puede ser mayor al precio total.');
      return;
    }

    // Preparar datos para enviar
    const appointmentData = {
      client_id: parseInt(clientId, 10),
      appointment_time: selectedDateTime.toISOString(),
      duration_minutes: parseInt(durationMinutes, 10) || 60,
      description: description.trim(),
      artist_id: parseInt(selectedArtistId, 10),
      total_price: numericTotalPrice,
      amount_paid: numericAmountPaid,
      payment_status: paymentStatus,
      status: status,
    };
    onSubmit(appointmentData);
  };

  // Clase para días pasados en DatePicker
  const getDayClassName = useCallback((date) => {
    if (isPast(date) && !isToday(date)) { return 'past-day'; }
    return '';
  }, []);

  // Deshabilitar formulario mientras guarda o carga datos esenciales
  const formDisabled = isSaving || isLoadingClients || isLoadingArtists || isLoadingTimes;

  return (
    <form onSubmit={handleInternalSubmit} className="w-full sm:max-w-lg sm:mx-auto bg-surface p-4 sm:p-6 rounded-lg shadow-lg space-y-4 border border-border-color">
      {/* Cliente Select */}
      <div>
        <label htmlFor="client" className="block text-sm font-medium text-text-secondary mb-1">Cliente:</label>
        <select id="client" value={clientId} onChange={handleClientChange} required className="w-full" disabled={isSaving || isLoadingClients} >
          <option value="">-- {isLoadingClients ? 'Cargando clientes...' : 'Selecciona un Cliente'} --</option>
          {clients.map(client => (<option key={client.id} value={client.id}>{client.name} ({client.email || 'Sin email'})</option>))}
        </select>
        {isLoadingClients && <span className="text-xs text-amber-400 ml-2 animate-pulse">Cargando...</span>}
      </div>

      {/* Artista Select */}
      <div>
          <label htmlFor="artist" className="block text-sm font-medium text-text-secondary mb-1">Artista Asignado:</label>
          <select
            id="artist"
            value={selectedArtistId}
            onChange={handleArtistChange}
            className="w-full"
            disabled={isSaving || isLoadingArtists}
            required
          >
            <option value="">-- {isLoadingArtists ? 'Cargando artistas...' : 'Selecciona un Artista'} --</option>
            {artists.map(art => (
              <option key={art.id} value={art.id}>{art.name}</option>
            ))}
          </select>
          {isLoadingArtists && <span className="text-xs text-amber-400 ml-2 animate-pulse">Cargando...</span>}
      </div>

      {/* Fecha y Hora */}
      <div>
        <label htmlFor="appointmentTime" className="block text-sm font-medium text-text-secondary mb-1">Fecha y Hora:</label>
        <DatePicker
          id="appointmentTime" selected={selectedDateTime} onChange={handleDateTimeChange} required showTimeSelect
          timeFormat="hh:mm aa" timeIntervals={15} dateFormat="Pp 'hrs.'" locale="es" placeholderText="Selecciona fecha y hora"
          className="w-full" wrapperClassName="w-full" disabled={formDisabled} autoComplete="off"
          minDate={new Date()}
          showPopperArrow={true} popperPlacement="bottom-start" popperClassName="react-datepicker-popper z-50"
          filterTime={filterTime} dayClassName={getDayClassName}
        />
         {isLoadingTimes && <span className="text-xs text-amber-400 ml-2 animate-pulse">Verificando disponibilidad...</span>}
         {selectedDateTime && !isLoadingTimes && !filterTime(selectedDateTime) && <p className="text-xs text-red-500 mt-1">Hora no disponible para este artista.</p>}
      </div>

      {/* Duración */}
      <div>
          <label htmlFor="duration" className="block text-sm font-medium text-text-secondary mb-1">Duración (min):</label>
          <input type="number" id="duration" value={durationMinutes} onChange={handleDurationChange} placeholder="Ej: 60" className="w-full" disabled={formDisabled} min="15" step="15" required />
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
          <label htmlFor="amountPaid" className="block text-sm font-medium text-text-secondary mb-1">Monto Pagado (Adelanto):</label>
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

AppointmentForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    client_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    artist_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    appointment_time: PropTypes.string,
    duration_minutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    total_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amount_paid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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