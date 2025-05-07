import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllAppointments } from '../services/appointmentService';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import { toast } from 'react-toastify';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// --- Configuración Localizador y Mensajes ---
const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), getDay, locales });
const messages = {
    allDay: 'Todo el día', previous: '<', next: '>', today: 'Hoy',
    month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
    date: 'Fecha', time: 'Hora', event: 'Evento', // Cambiado 'Cliente' por 'Evento' para más generalidad
    noEventsInRange: 'No hay citas en este rango.',
    showMore: total => `+ ${total} más...`
};
const availableViews = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]; // Añadir vistas si se desean

// --- Helper para formatear moneda ---
const formatCurrency = (value) => {
  if (value == null || isNaN(Number(value))) return ''; // Devolver string vacío si no es válido
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// --- Componente Personalizado para el Evento ---
const CustomEvent = ({ event, view }) => {
    // El título ahora combina cliente y artista si existe
    const { title } = event;
    const description = event.resource?.description;
    const paymentStatus = event.resource?.payment_status;
    const totalPrice = event.resource?.total_price;
    const amountPaid = event.resource?.amount_paid;
    const clientName = event.resource?.client_name; // Obtener nombre del cliente
    const artistName = event.resource?.artist_name; // Obtener nombre del artista

    // Calcular saldo pendiente si aplica
    let balance = null;
    if (paymentStatus === 'deposit_paid' && typeof totalPrice === 'number' && totalPrice > (amountPaid ?? 0)) {
      balance = totalPrice - (amountPaid ?? 0);
    }

    // Layout para vistas Mes, Semana, Día
    if (view !== 'agenda') {
        return (
            <div className="text-xs leading-tight overflow-hidden rbc-event-content">
                {/* Mostrar Cliente (Artista opcional o como parte del título/descripción si cabe) */}
                <strong className="block truncate font-semibold">{clientName || 'Cliente Desconocido'}</strong>
                {artistName && <span className="text-[9px] opacity-80 block truncate">Artista: {artistName}</span>}
                {description && (<p className="text-[10px] opacity-80 mt-0.5 truncate">{description}</p>)}
                {balance !== null && (<p className="text-[10px] font-medium text-amber-400 mt-0.5 truncate">Saldo: {formatCurrency(balance)}</p>)}
            </div>
        );
    }

    // Layout específico para vista AGENDA
    return (
        <div className="rbc-event-content agenda-layout-container">
            {/* Sección Cliente y Artista */}
            <div className="agenda-section agenda-client">
                <strong className="font-semibold text-sm">{clientName || 'Cliente Desconocido'}</strong>
                {artistName && <span className="text-xs text-text-secondary ml-1">({artistName})</span>}
            </div>

            {/* Sección Descripción (Tatuaje) */}
            <div className="agenda-section agenda-description">
                {description ? (
                    <p className="text-sm whitespace-normal">{description}</p>
                ) : (
                    <p className="text-sm opacity-50">-</p>
                )}
            </div>

            {/* Sección Saldo */}
            <div className="agenda-section agenda-balance">
                {balance !== null ? (
                     <p className="text-sm font-medium text-amber-400">
                        Saldo: {formatCurrency(balance)}
                     </p>
                 ) : (
                     <p className="text-sm opacity-50">-</p>
                 )}
            </div>
        </div>
    );
};


function AppointmentsListPage() {
  const [rawAppointments, setRawAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date()); // Fecha actual del calendario
  const [currentView, setCurrentView] = useState(Views.MONTH); // Vista actual

  // --- Carga de Datos ---
  useEffect(() => {
    let isMounted = true;
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const data = await getAllAppointments(); // Servicio que ahora trae artist_name
            if (isMounted) {
                setRawAppointments(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al cargar citas.';
            if (isMounted) {
                if (err.response?.status !== 401 && err.response?.status !== 403) {
                    toast.error(msg);
                } // Errores de auth manejados por interceptor
            }
            console.error("Error fetching appointments:", err);
            if (isMounted) setRawAppointments([]);
        } finally {
            if (isMounted) setLoading(false);
        }
    };
    fetchAppointments();
    return () => { isMounted = false; };
  }, []); // Solo al montar

  // --- Estilo de Eventos ---
  const eventStyleGetter = useCallback((event, start, end, isSelected) => {
    const status = event.resource?.status; let statusClasses = '';
    switch (status) { case 'completed': statusClasses = 'bg-status-completed border-emerald-700 text-white'; break; case 'canceled': statusClasses = 'bg-status-canceled border-gray-600 text-gray-100 line-through opacity-70'; break; case 'no-show': statusClasses = 'bg-status-noshow border-red-700 text-white opacity-80'; break; case 'scheduled': default: statusClasses = 'bg-secondary border-border-color text-text-primary'; break; }
    let combinedClasses = statusClasses;
    if (event.resource?.payment_status === 'deposit_paid' && typeof event.resource?.total_price === 'number' && event.resource.total_price > (event.resource?.amount_paid ?? 0) ) { combinedClasses += ' border-l-4 border-l-amber-400'; }
    if (isSelected) { combinedClasses = 'bg-primary border-primary-variant text-text-on-primary ring-2 ring-white'; }
    return { className: combinedClasses };
  }, []);

  // --- Transformación de Citas Raw a Eventos del Calendario ---
   const events = useMemo(() => {
       if (!Array.isArray(rawAppointments)) return [];
       return rawAppointments.map((appt, index) => {
           try {
               // Validaciones básicas de la cita raw
               if (!appt || typeof appt.appointment_time !== 'string') {
                   console.warn(`Cita inválida o sin fecha en índice ${index}:`, appt); return null;
               }
               const startDate = parseISO(appt.appointment_time);
               if (!isValid(startDate)) {
                   console.warn(`Fecha inválida para cita ${appt.id || index}:`, appt.appointment_time); return null;
               }

               // Calcular fecha de fin (usar 60 min si no hay duración o es inválida)
               const duration = (typeof appt.duration_minutes === 'number' && appt.duration_minutes > 0) ? appt.duration_minutes : 60;
               const endDate = new Date(startDate.getTime() + duration * 60000);
               if (!isValid(endDate)) {
                   console.warn(`Fecha de fin inválida para cita ${appt.id || index}`); return null;
               }

               // Crear título
               const title = appt.client_name || `Cita ID ${appt.id}`;

               // El objeto 'resource' contiene todos los datos originales de la cita (incluyendo artist_name)
               // para que el componente CustomEvent pueda usarlos
               const resource = {
                   ...appt, // Incluir todos los datos originales
                   total_price: appt.total_price != null && !isNaN(Number(appt.total_price)) ? Number(appt.total_price) : null,
                   amount_paid: appt.amount_paid != null && !isNaN(Number(appt.amount_paid)) ? Number(appt.amount_paid) : 0,
                   duration_minutes: duration,
               };

               return {
                   id: appt.id,
                   title: title, // Título base (puede ser solo el cliente)
                   start: startDate,
                   end: endDate,
                   resource: resource // Pasar todos los datos para uso en CustomEvent
               };

           } catch (e) {
               console.error(`Error procesando cita ${appt?.id || index} para calendario:`, appt, e);
               return null;
           }
       }).filter(Boolean); // Filtrar cualquier cita que haya resultado en null
   }, [rawAppointments]);

  // --- Handlers del Calendario ---
  const handleSelectEvent = useCallback((event) => {
      // Navegar a la página de edición al hacer clic en una cita
      navigate(`/appointments/edit/${event.id}`);
  }, [navigate]);

  const handleSelectSlot = useCallback(({ start, end }) => {
      // Navegar a la página de añadir nueva cita al hacer clic en un slot vacío
      // Podríamos pasar la fecha/hora seleccionada si quisiéramos pre-rellenar el formulario
      navigate('/appointments/new');
  }, [navigate]);

  const handleNavigate = useCallback((newDate) => {
      // Actualizar la fecha que muestra el calendario
      setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView) => {
      // Actualizar la vista actual (Mes, Semana, Día, Agenda)
      if (availableViews.includes(newView)) {
          setCurrentView(newView);
      }
  }, []); // availableViews es constante

  // --- Renderizado ---
  if (loading) {
    return <div className="text-center text-text-secondary p-10">Cargando calendario...</div>;
  }

  return (
    <div>
      {/* Cabecera con título y botón de añadir */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1>Calendario de Citas</h1>
        <Link to="/appointments/new" className="self-start sm:self-center">
            <button className="btn-primary"> Agendar Nueva Cita </button>
        </Link>
      </div>

      {/* Contenedor del Calendario */}
      <div className="h-[75vh] bg-surface p-1 md:p-4 rounded-lg shadow-lg border border-border-color text-text-primary relative"> {/* Añadir relative para posibles overlays */}
        {/* Mensaje si no hay eventos y no está cargando */}
        {!loading && events.length === 0 && (
            <p className='text-center text-text-secondary py-10 italic'>
                No hay citas para mostrar en el rango actual.
            </p>
        )}
        {/* Componente Calendar */}
        {/* Añadir key para forzar re-render si cambian las vistas o la fecha, útil para algunos refrescos */}
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture='es'
            messages={messages}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            selectable={true} // Permite seleccionar slots
            onSelectSlot={handleSelectSlot}
            view={currentView} // Vista actual controlada por estado
            views={availableViews} // Vistas disponibles
            onView={handleViewChange} // Handler para cambio de vista
            date={currentDate} // Fecha actual controlada por estado
            onNavigate={handleNavigate} // Handler para cambio de fecha/navegación
            className="-mx-1 md:-mx-4 -my-1 md:-my-4" // Clases para ajustar padding/margen si es necesario
            key={currentView + currentDate.toISOString()} // Forzar re-render en cambio de vista/fecha
            components={{
                event: (props) => <CustomEvent {...props} view={currentView} /> // Usar componente personalizado
            }}
            step={30} // Intervalo en minutos para la vista de día/semana
            timeslots={2} // Cuántos slots por 'step' (ej. 2 slots de 30min por hora)
            popup // Usar popups para eventos solapados en vista mes
        />
      </div>
    </div>
  );
}

export default AppointmentsListPage;