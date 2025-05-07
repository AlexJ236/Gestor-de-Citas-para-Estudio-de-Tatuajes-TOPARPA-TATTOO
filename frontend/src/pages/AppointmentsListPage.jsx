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

// Configuración Localizador
const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), getDay, locales });

// Mensajes del calendario (localización)
const messages = {
    allDay: 'Todo el día',
    previous: '<',
    next: '>',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay citas en este rango.',
    showMore: total => `+ ${total} más...`
};

// --- VISTAS DISPONIBLES PARA EL CALENDARIO ---
const availableViews = [Views.MONTH, Views.AGENDA];

// Helper para formatear moneda
const formatCurrency = (value) => {
  if (value == null || isNaN(Number(value))) return '';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// Componente Personalizado para el Evento
const CustomEvent = ({ event, view }) => {
    const clientName = event.resource?.client_name;
    const artistName = event.resource?.artist_name;
    const description = event.resource?.description;
    const paymentStatus = event.resource?.payment_status;
    const totalPrice = event.resource?.total_price;
    const amountPaid = event.resource?.amount_paid;
    let balance = null;
    if (paymentStatus === 'deposit_paid' && typeof totalPrice === 'number' && totalPrice > (amountPaid ?? 0)) {
      balance = totalPrice - (amountPaid ?? 0);
    }

    if (view !== 'agenda') { // Para la vista 'Mes'
        return (
            <div className="text-xs leading-tight overflow-hidden rbc-event-content">
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
            <div className="agenda-section agenda-client">
                <strong className="font-semibold text-sm">{clientName || 'Cliente Desconocido'}</strong>
                {artistName && <span className="text-xs text-text-secondary ml-1">({artistName})</span>}
            </div>
            <div className="agenda-section agenda-description">
                {description ? (<p className="text-sm whitespace-normal">{description}</p>) : (<p className="text-sm opacity-50">-</p>)}
            </div>
            <div className="agenda-section agenda-balance">
                {balance !== null ? (<p className="text-sm font-medium text-amber-400">Saldo: {formatCurrency(balance)}</p>) : (<p className="text-sm opacity-50">-</p>)}
            </div>
        </div>
    );
};


function AppointmentsListPage() {
  const [rawAppointments, setRawAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  // Asegúrate de que la vista inicial sea una de las permitidas
  const [currentView, setCurrentView] = useState(Views.MONTH); // O Views.AGENDA si prefieres

  // Carga de Datos
  useEffect(() => {
    let isMounted = true;
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const data = await getAllAppointments();
            if (isMounted) setRawAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al cargar citas.';
            if (isMounted && err.response?.status !== 401 && err.response?.status !== 403) toast.error(msg);
            if (isMounted) setRawAppointments([]);
        } finally {
            if (isMounted) setLoading(false);
        }
    };
    fetchAppointments();
    return () => { isMounted = false; };
  }, []);

  // Estilo de Eventos
  const eventStyleGetter = useCallback((event) => {
    const status = event.resource?.status; let statusClasses = '';
    switch (status) { case 'completed': statusClasses = 'bg-status-completed border-emerald-700 text-white'; break; case 'canceled': statusClasses = 'bg-status-canceled border-gray-600 text-gray-100 line-through opacity-70'; break; case 'no-show': statusClasses = 'bg-status-noshow border-red-700 text-white opacity-80'; break; default: statusClasses = 'bg-secondary border-border-color text-text-primary'; break; }
    if (event.resource?.payment_status === 'deposit_paid' && typeof event.resource?.total_price === 'number' && event.resource.total_price > (event.resource?.amount_paid ?? 0) ) { statusClasses += ' border-l-4 border-l-amber-400'; }
    return { className: statusClasses };
  }, []);

   // Transformación de Citas Raw a Eventos del Calendario
   const events = useMemo(() => {
       if (!Array.isArray(rawAppointments)) return [];
       return rawAppointments.map((appt) => {
           try {
               if (!appt || typeof appt.appointment_time !== 'string') return null;
               const startDate = parseISO(appt.appointment_time);
               if (!isValid(startDate)) return null;
               const duration = (typeof appt.duration_minutes === 'number' && appt.duration_minutes > 0) ? appt.duration_minutes : 60;
               const endDate = new Date(startDate.getTime() + duration * 60000);
               if (!isValid(endDate)) return null;
               const title = appt.client_name || `Cita ID ${appt.id}`;
               const resource = { ...appt };
               return { id: appt.id, title, start: startDate, end: endDate, resource };
           } catch (e) { return null; }
       }).filter(Boolean);
   }, [rawAppointments]);

  // Handlers del Calendario
  const handleSelectEvent = useCallback((event) => navigate(`/appointments/edit/${event.id}`), [navigate]);
  const handleSelectSlot = useCallback(({ start, end }) => navigate('/appointments/new'), [navigate]);
  const handleNavigate = useCallback((newDate) => setCurrentDate(newDate), []);
  const handleViewChange = useCallback((newView) => {
      // Solo permitir cambiar a las vistas que están en availableViews
      if (availableViews.includes(newView)) {
          setCurrentView(newView);
      }
  }, []);

  // Renderizado
  if (loading) return <div className="text-center text-text-secondary p-10">Cargando calendario...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1>Calendario de Citas</h1>
        <Link to="/appointments/new" className="self-start sm:self-center">
            <button className="btn-primary"> Agendar Nueva Cita </button>
        </Link>
      </div>

      <div className="h-[75vh] bg-surface p-1 md:p-4 rounded-lg shadow-lg border border-border-color text-text-primary relative">
        {!loading && events.length === 0 && (<p className='text-center text-text-secondary py-10 italic'>No hay citas para mostrar.</p>)}
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture='es'
            messages={messages}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            selectable={true}
            onSelectSlot={handleSelectSlot}
            view={currentView} // Vista actual controlada por estado
            views={availableViews} // <<< PASANDO LAS VISTAS RESTRINGIDAS
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            className="-mx-1 md:-mx-4 -my-1 md:-my-4" // Ajustes de estilo
            key={currentView + currentDate.toISOString()}
            components={{
                event: (props) => <CustomEvent {...props} view={currentView} />
            }}
            step={30}
            timeslots={2}
            popup // Mantiene los popups para la vista de mes si hay muchos eventos
            defaultView={Views.MONTH} // Opcional: Establecer la vista por defecto
        />
      </div>
    </div>
  );
}

export default AppointmentsListPage;