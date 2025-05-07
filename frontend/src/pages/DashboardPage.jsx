import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllClients } from '../services/clientService';
import { getAllAppointments } from '../services/appointmentService';
import { getFinancialSummary } from '../services/reportService';
import { toast } from 'react-toastify';
import { Users, CalendarClock, CalendarPlus, UserPlus, AlertCircle, ListChecks, TrendingUp, TrendingDown, Scale, MinusCircle } from 'lucide-react';
import {
    isToday, isFuture, startOfDay, endOfDay, addDays, parseISO, format, isValid,
    startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth
} from 'date-fns';
import es from 'date-fns/locale/es';

// Helper para formatear moneda
const formatCurrency = (value) => {
  if (value == null || isNaN(Number(value))) return '$ 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// Componente reutilizable para tarjetas de resumen
const SummaryCard = ({ title, value, icon, bgColor = 'bg-surface', textColor = 'text-text-primary', iconColor = 'text-primary' }) => (
    <div className={`${bgColor} p-4 md:p-6 rounded-lg shadow-lg border border-border-color flex items-center space-x-3 md:space-x-4`}>
        <div className={`p-2 md:p-3 rounded-full ${iconColor.startsWith('text-') ? 'bg-black/20' : bgColor === 'bg-surface' ? 'bg-gray-700/50' : 'bg-white/30'} ${iconColor} flex-shrink-0`}>
             {React.createElement(icon, { size: 20, className: 'md:size-6', strokeWidth: 1.5 })}
        </div>
        <div>
            <p className="text-xs sm:text-sm text-text-secondary mb-0.5">{title}</p>
            <p className={`text-xl sm:text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
    </div>
);

function DashboardPage() {
  // Estados
  const [clientCount, setClientCount] = useState(0);
  const [appointmentsTodayCount, setAppointmentsTodayCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingBalanceAppointments, setPendingBalanceAppointments] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({ income: null, expenses: null, profit: null, pendingBalance: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efecto para cargar datos (modificado para usar artist_name)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      const today = new Date(); const currentYear = getYear(today); const currentMonth = getMonth(today) + 1;

      try {
        // Obtener todos los datos en paralelo
        const [clientsData, appointmentsData, summaryData] = await Promise.all([
          getAllClients().catch(err => { console.error("Error parcial: Clientes", err); return []; }), // Manejar error parcial
          getAllAppointments().catch(err => { console.error("Error parcial: Citas", err); return []; }), // Manejar error parcial
          getFinancialSummary(currentYear, currentMonth).catch(err => { console.error("Error parcial: Resumen", err); return null; }) // Manejar error parcial
        ]);

        // Procesar Clientes
        setClientCount(Array.isArray(clientsData) ? clientsData.length : 0);

        // Procesar Resumen Financiero
        if (summaryData) {
            setFinancialSummary({ income: summaryData.income, expenses: summaryData.expenses, profit: summaryData.profit, pendingBalance: summaryData.pendingBalance });
        } else {
             // No mostrar error si solo falla el resumen, pero loguearlo
             console.warn("No se pudo cargar el resumen financiero para el dashboard.");
             setFinancialSummary({ income: null, expenses: null, profit: null, pendingBalance: null });
        }

        // Procesar Citas
        const startOfToday = startOfDay(today);
        const upcomingTodayList = [];
        const pendingBalanceList = [];

        if (Array.isArray(appointmentsData)) {
          appointmentsData.forEach(appt => {
            try {
              if (!appt || typeof appt.appointment_time !== 'string' || appt.status === 'canceled') return; // Ignorar canceladas aquí

              const apptDate = parseISO(appt.appointment_time);
              if (!isValid(apptDate)) return;

              const apptStartOfDay = startOfDay(apptDate);
              const isActiveAppointment = appt.status === 'scheduled'; // Considerar solo agendadas para listas de "próximas"

              // Citas para Hoy
              if (isActiveAppointment && apptStartOfDay.getTime() === startOfToday.getTime()) {
                  upcomingTodayList.push({
                      id: appt.id,
                      time: format(apptDate, 'HH:mm', { locale: es }),
                      clientName: appt.client_name || '?',
                      artistName: appt.artist_name || '-'
                  });
              }

              // Citas con Saldo Pendiente (Agendadas y futuras/hoy)
              const totalPrice = appt.total_price != null && !isNaN(Number(appt.total_price)) ? Number(appt.total_price) : null;
              const amountPaid = appt.amount_paid != null && !isNaN(Number(appt.amount_paid)) ? Number(appt.amount_paid) : 0;
              const balance = (appt.payment_status === 'deposit_paid' && typeof totalPrice === 'number' && totalPrice > amountPaid) ? totalPrice - amountPaid : null;

              if (isActiveAppointment && apptDate >= startOfToday && balance !== null && balance > 0) {
                  pendingBalanceList.push({
                      id: appt.id,
                      originalDate: apptDate,
                      date: format(apptDate, 'eee dd/MMM', { locale: es }),
                      time: format(apptDate, 'HH:mm', { locale: es }),
                      clientName: appt.client_name || '?',
                      artistName: appt.artist_name || '-',
                      balance: balance
                  });
              }
            } catch (parseError) {
              console.error("Error procesando cita para listas del dashboard:", appt, parseError);
            }
          });
        } else {
            console.warn("appointmentsData no es un array válido");
        }

        // Ordenar listas
        upcomingTodayList.sort((a, b) => a.time.localeCompare(b.time));
        pendingBalanceList.sort((a,b) => a.originalDate.getTime() - b.originalDate.getTime());

        // Actualizar estado
        setUpcomingAppointments(upcomingTodayList);
        setAppointmentsTodayCount(upcomingTodayList.length);
        setPendingBalanceAppointments(pendingBalanceList);

      } catch (err) { // Error general si falla Promise.all o algo no manejado
        console.error("Error fatal cargando datos del dashboard:", err);
        const msg = err.response?.data?.message || 'No se pudieron cargar todos los datos.';
        setError(msg);
        if (err.response?.status !== 401 && err.response?.status !== 403) {
            toast.error(msg);
        }
        // Resetear estados en caso de error fatal
        setFinancialSummary({ income: null, expenses: null, profit: null, pendingBalance: null });
        setClientCount(0); setAppointmentsTodayCount(0); setUpcomingAppointments([]); setPendingBalanceAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Ejecutar solo al montar

  // Variables para mostrar
  const displayIncome = loading ? '...' : formatCurrency(financialSummary.income);
  const displayExpenses = loading ? '...' : formatCurrency(financialSummary.expenses);
  const displayProfit = loading ? '...' : formatCurrency(financialSummary.profit);
  const displayPending = loading ? '...' : formatCurrency(financialSummary.pendingBalance);
  const displayClients = loading ? '...' : clientCount;
  const displayAppointmentsToday = loading ? '...' : appointmentsTodayCount;

  // JSX (modificado para mostrar artistName)
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Dashboard Principal</h1>
      {loading && <p className="text-text-secondary text-center py-4">Cargando datos...</p>}
      {error && !loading && ( <div className="bg-red-900/30 border border-accent text-red-300 px-4 py-3 rounded relative mb-6 flex items-center" role="alert"> <AlertCircle size={20} className="mr-2"/> <span>{error}</span> </div> )}

      <div className={`space-y-8 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Sección Resumen General */}
          <section>
             <h2 className="text-lg md:text-xl font-semibold text-text-secondary mb-4">Resumen General</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  <SummaryCard title="Clientes Totales" value={displayClients} icon={Users} iconColor="text-blue-400" />
                  <SummaryCard title="Ingresos Este Mes" value={displayIncome} icon={TrendingUp} iconColor="text-green-500"/>
                  <SummaryCard title="Gastos Este Mes" value={displayExpenses} icon={TrendingDown} iconColor="text-red-500"/>
                  <SummaryCard title="Beneficio Este Mes" value={displayProfit} icon={Scale} iconColor="text-teal-400"/>
                  <SummaryCard title="Citas Hoy" value={displayAppointmentsToday} icon={CalendarClock} iconColor="text-yellow-400"/>
                  <SummaryCard title="Saldo Pendiente Total" value={displayPending} icon={ListChecks} iconColor="text-amber-400"/>
             </div>
          </section>

          {/* Sección Citas para Hoy */}
          <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-secondary mb-4">
                  Citas para Hoy ({format(new Date(), 'EEEE dd/MM', { locale: es })})
              </h2>
              {!loading && upcomingAppointments.length === 0 && !error ? (
                  <p className="text-text-secondary italic bg-surface p-4 rounded-lg border border-border-color">No hay citas agendadas para hoy.</p>
              ) : (
                  <div className="bg-surface rounded-lg shadow-lg border border-border-color overflow-hidden">
                      <ul className="divide-y divide-border-color/50">
                          {loading ? ( <li className="px-4 py-3 text-center text-text-secondary">...</li> )
                           : ( upcomingAppointments.map(appt => (
                              <li key={appt.id} className="px-3 py-3 md:px-4 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-2 hover:bg-white/5 transition-colors">
                                  {/* Hora */}
                                  <span className="text-primary font-semibold w-14 text-left text-sm md:text-base flex-shrink-0 order-1 md:order-none">{appt.time}</span>
                                  {/* Cliente y Artista */}
                                  <div className='flex-1 min-w-0 order-2 md:order-none'>
                                      <span className="text-text-primary text-sm md:text-base truncate">{appt.clientName}</span>
                                      <span className='text-xs text-text-secondary ml-1 md:ml-2 truncate'>({appt.artistName})</span> {/* <-- MOSTRAR ARTISTA */}
                                  </div>
                                  {/* Enlace Editar */}
                                  <Link to={`/appointments/edit/${appt.id}`} className="text-xs text-primary hover:underline ml-auto md:ml-2 shrink-0 self-end md:self-center order-3 md:order-none mt-1 md:mt-0">
                                      Ver/Editar
                                  </Link>
                              </li>
                          )) )}
                      </ul>
                  </div>
              )}
          </section>

          {/* Sección Citas con Saldo Pendiente */}
          <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-secondary mb-4 flex items-center gap-2">
                  <ListChecks size={20}/> Citas con Saldo Pendiente (Próximas)
              </h2>
               {!loading && pendingBalanceAppointments.length === 0 && !error ? (
                   <p className="text-text-secondary italic bg-surface p-4 rounded-lg border border-border-color">No hay citas próximas con saldo pendiente.</p>
               ) : (
                   <div className="bg-surface rounded-lg shadow-lg border border-border-color overflow-hidden">
                       <ul className="divide-y divide-border-color/50">
                           {loading ? ( <li className="px-4 py-3 text-center text-text-secondary">...</li> )
                            : ( pendingBalanceAppointments.map(appt => (
                               <li key={appt.id} className="px-3 py-3 md:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-x-3 gap-y-1 hover:bg-white/5 transition-colors">
                                   {/* Fecha y Hora */}
                                   <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0 order-1'>
                                       <span className="text-text-secondary text-xs sm:text-sm w-16 sm:w-20">{appt.date}</span>
                                       <span className="text-primary text-xs sm:text-sm w-12">{appt.time}</span>
                                   </div>
                                   {/* Cliente y Artista */}
                                   <div className='flex-1 min-w-0 order-3 sm:order-2 mt-1 sm:mt-0'>
                                       <span className="text-text-primary text-sm sm:text-base font-medium truncate block">{appt.clientName}</span>
                                        <span className='text-xs text-text-secondary ml-1 md:ml-0 block truncate'>({appt.artistName})</span> {/* <-- MOSTRAR ARTISTA */}
                                   </div>
                                   {/* Saldo */}
                                   <div className='flex items-center gap-3 text-xs sm:text-sm flex-shrink-0 order-2 sm:order-3'>
                                       <span className="text-amber-400 font-semibold"> Saldo: {formatCurrency(appt.balance)} </span>
                                   </div>
                                   {/* Enlace */}
                                   <Link to={`/appointments/edit/${appt.id}`} className="text-xs text-primary hover:underline shrink-0 self-end order-4 ml-auto sm:ml-2">
                                       Ver/Editar Cita
                                   </Link>
                               </li>
                           )) )}
                       </ul>
                   </div>
               )}
          </section>

          {/* Sección Acciones Rápidas */}
          <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-secondary mb-4">Acciones Rápidas</h2>
              <div className="flex flex-wrap gap-3 md:gap-4">
                  <Link to="/appointments/new"> <button className="btn-primary flex items-center gap-2"> <CalendarPlus size={18} /> Agendar Cita </button> </Link>
                  <Link to="/clients/new"> <button className="btn-secondary flex items-center gap-2"> <UserPlus size={18} /> Añadir Cliente </button> </Link>
                  <Link to="/expenses"> <button className="btn-secondary flex items-center gap-2"> <MinusCircle size={18}/> Gastos </button> </Link>
              </div>
          </section>
      </div>
    </div>
  );
}

export default DashboardPage;