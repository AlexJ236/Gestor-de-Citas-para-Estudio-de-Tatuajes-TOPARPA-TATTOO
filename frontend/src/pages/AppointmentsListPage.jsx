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
import 'react-big-calendar/lib/css/react-big-calendar.css';

// --- Configuración Localizador y Mensajes ---
const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), getDay, locales });
const messages = {
    allDay: 'Todo el día', previous: '<', next: '>', today: 'Hoy',
    month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
    date: 'Fecha', time: 'Hora', event: 'Cliente',
    noEventsInRange: 'No hay citas en este rango.',
    showMore: total => `+ ${total} más...`
};
const availableViews = [Views.MONTH, Views.AGENDA];

// --- Helper para formatear moneda ---
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return '';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};


// --- Componente Personalizado para el Evento ---
const CustomEvent = ({ event, view }) => {
    const { title } = event;
    const description = event.resource?.description;
    const paymentStatus = event.resource?.payment_status;
    const totalPrice = event.resource?.total_price;
    const amountPaid = event.resource?.amount_paid;

    let balance = null;
    if (paymentStatus === 'deposit_paid' && typeof totalPrice === 'number' && typeof amountPaid === 'number' && totalPrice > amountPaid) {
      balance = totalPrice - amountPaid;
    }

    // Layout para vistas Mes (u otras futuras)
    if (view !== 'agenda') {
        return (
            <div className="text-xs leading-tight overflow-hidden rbc-event-content">
                <strong className="block truncate font-semibold">{title}</strong>
                {description && (<p className="text-[10px] opacity-80 mt-0.5 truncate">{description}</p>)}
                {balance !== null && (<p className="text-[10px] font-medium text-amber-400 mt-0.5 truncate">Saldo: {formatCurrency(balance)}</p>)}
            </div>
        );
    }

    // Layout para vista AGENDA
    return (
        <div className="rbc-event-content agenda-layout-container">
            {/* Sección Cliente */}
            <div className="agenda-section agenda-client">
                <strong className="font-semibold text-sm">{title}</strong> {/* Título base SM */}
            </div>

            {/* Sección Descripción (Tatuaje) */}
            <div className="agenda-section agenda-description">
                {description ? (
                    // <<< CAMBIO: Usar text-sm y quitar opacidad
                    <p className="text-sm whitespace-normal">{description}</p>
                ) : (
                    <p className="text-sm opacity-50">-</p> // Placeholder
                )}
            </div>

            {/* Sección Saldo */}
            <div className="agenda-section agenda-balance">
                {balance !== null ? (
                     // <<< CAMBIO: Usar text-sm
                     <p className="text-sm font-medium text-amber-400">
                        {formatCurrency(balance)}
                     </p>
                 ) : (
                     <p className="text-sm opacity-50">-</p> // Placeholder
                 )}
            </div>
        </div>
    );
};


function AppointmentsListPage() {
  const [rawAppointments, setRawAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  // --- Carga de Datos ---
  useEffect(() => {
    let isMounted = true;
    const fetchAppointments = async () => {
        setLoading(true); try { const data = await getAllAppointments(); if(isMounted) setRawAppointments(Array.isArray(data) ? data : []); }
        catch (err) { const msg = err.response?.data?.message || 'Error al cargar citas.'; if(isMounted){ if (err.response?.status === 401 || err.response?.status === 403) toast.error('Acceso denegado.'); else toast.error(msg); } console.error(err); if(isMounted) setRawAppointments([]); }
        finally { if(isMounted) setLoading(false); }
    };
    fetchAppointments();
    return () => { isMounted = false; };
  }, []);

  // --- Estilo de Eventos ---
  const eventStyleGetter = useCallback((event, start, end, isSelected) => {
    const status = event.resource?.status; let statusClasses = '';
    switch (status) { case 'completed': statusClasses = 'bg-status-completed border-emerald-700 text-white'; break; case 'canceled': statusClasses = 'bg-status-canceled border-gray-600 text-gray-100 line-through opacity-70'; break; case 'no-show': statusClasses = 'bg-status-noshow border-red-700 text-white opacity-80'; break; case 'scheduled': default: statusClasses = 'bg-secondary border-border-color text-text-primary'; break; }
    let combinedClasses = statusClasses;
    if (event.resource?.payment_status === 'deposit_paid' && typeof event.resource?.total_price === 'number' && event.resource.total_price > (event.resource?.amount_paid ?? 0) ) { combinedClasses += ' border-l-4 border-l-amber-400'; }
    if (isSelected) { combinedClasses = 'bg-primary border-primary-variant text-text-on-primary ring-2 ring-white'; }
    return { className: combinedClasses };
  }, []);

  // --- Transformación de Eventos ---
   const events = useMemo(() => {
       if (!Array.isArray(rawAppointments)) return [];
       return rawAppointments.map((appt, index) => {
           try {
               if (!appt || typeof appt.appointment_time !== 'string') return null;
               const startDate = parseISO(appt.appointment_time); if (isNaN(startDate.getTime())) return null;
               const duration = (typeof appt.duration_minutes === 'number' && appt.duration_minutes > 0) ? appt.duration_minutes : 60;
               const endDate = new Date(startDate.getTime() + duration * 60000); if (isNaN(endDate.getTime())) return null;
               let titleParts = []; if (appt.client_name) titleParts.push(appt.client_name); if (appt.artist) titleParts.push(`(${appt.artist})`);
               let title = titleParts.join(' ') || `Cita ID ${appt.id}`;
               const resource = { ...appt, total_price: appt.total_price != null && !isNaN(Number(appt.total_price)) ? Number(appt.total_price) : null, amount_paid: appt.amount_paid != null && !isNaN(Number(appt.amount_paid)) ? Number(appt.amount_paid) : null, duration_minutes: duration };
               return { id: appt.id, title: title, start: startDate, end: endDate, resource: resource };
           } catch (e) { console.error(`Error processing appt ${index}:`, appt, e); return null; }
       }).filter(Boolean);
   }, [rawAppointments]);

  // --- Handlers ---
  const handleSelectEvent = useCallback((event) => { navigate(`/appointments/edit/${event.id}`); }, [navigate]);
  const handleSelectSlot = useCallback(({ start, end }) => { navigate('/appointments/new'); }, [navigate]);
  const handleNavigate = useCallback((newDate) => setCurrentDate(newDate), []);
  const handleViewChange = useCallback((newView) => { if (availableViews.includes(newView)) { setCurrentView(newView); } }, []); // availableViews es constante global

  // --- Renderizado ---
  if (loading) { return <div className="text-center text-text-secondary p-10">Cargando calendario...</div>; }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Calendario de Citas</h1>
        <Link to="/appointments/new"> <button className="btn-primary"> Agendar Nueva Cita </button> </Link>
      </div>

      <div className="h-[75vh] bg-surface p-1 md:p-4 rounded-lg shadow-md text-text-primary">
        {!loading && events.length === 0 && ( <p className='text-center text-text-secondary py-4'> No hay citas para mostrar. </p> )}
        <Calendar
            localizer={localizer} events={events} startAccessor="start" endAccessor="end" culture='es'
            messages={messages} eventPropGetter={eventStyleGetter} onSelectEvent={handleSelectEvent}
            selectable={true} onSelectSlot={handleSelectSlot} view={currentView} views={availableViews}
            onView={handleViewChange} date={currentDate} onNavigate={handleNavigate}
            className="-mx-1 md:-mx-4 -my-1 md:-my-4" key={currentView + currentDate.toISOString()}
            components={{ event: (props) => <CustomEvent {...props} view={currentView} /> }} // Pasar vista a CustomEvent
            step={30} timeslots={2} popup
        />
      </div>
    </div>
  );
}

export default AppointmentsListPage;