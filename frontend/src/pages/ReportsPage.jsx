import React, { useState, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { getDailyReportData, getMonthlyReportData } from '../services/reportService';
import FinancialReport from '../components/FinancialReport';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Download, Calendar as CalendarIcon } from 'lucide-react';

registerLocale('es', es);

function ReportsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reportData, setReportData] = useState(null); // Para renderizar el reporte
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef(null); // Ref para el div que contiene FinancialReport

    // Función para obtener datos y luego capturar imagen
    const handleGenerateAndCapture = async (type) => {
        setIsGenerating(true);
        setReportData(null); // Limpiar reporte anterior
        let data = null;
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();

        try {
            if (type === 'daily') {
                data = await getDailyReportData(year, month, day);
            } else { // monthly
                data = await getMonthlyReportData(year, month);
            }

            if (data && (data.incomeDetails?.length > 0 || data.expenseDetails?.length > 0)) {
                setReportData(data); // Renderizar el reporte con los datos

                // Esperar un breve instante para asegurar que React haya renderizado el componente
                setTimeout(() => {
                    captureReportImage(type, data); // Pasar tipo y datos para nombre archivo
                }, 200); // Ajustar delay si es necesario

            } else {
                toast.info(`No hay datos significativos para generar el reporte ${type}.`);
                setIsGenerating(false);
            }
        } catch (error) {
            // El servicio ya debería mostrar toast de error
            console.error(`Error fetching report data (${type}):`, error);
            setIsGenerating(false);
        }
    };

    // Función para capturar la imagen usando html2canvas
    const captureReportImage = (type, currentReportData) => {
        if (!reportRef.current) {
            toast.error("Error interno: No se pudo referenciar el área del reporte.");
            setIsGenerating(false);
            return;
        }

        toast.info("Generando imagen del reporte...");

        html2canvas(reportRef.current, {
            scale: 2, // Mejor resolución
            useCORS: true,
            logging: false, // Cambiar a true para debug de html2canvas
            backgroundColor: '#ffffff' // Forzar fondo blanco para la imagen
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            let dateStr = '';
            if (type === 'daily') {
                dateStr = currentReportData.date; // Usa YYYY-MM-DD del backend
            } else {
                dateStr = `<span class="math-inline">\{currentReportData\.year\}\-</span>{String(currentReportData.month).padStart(2, '0')}`;
            }
            link.download = `reporte-<span class="math-inline">\{type\}\-</span>{dateStr}.png`;
            link.href = imgData;
            document.body.appendChild(link); // Necesario para Firefox
            link.click();
            document.body.removeChild(link);
            toast.success("¡Reporte generado como imagen!");
            setReportData(null); // Limpiar el reporte renderizado después de descargar
        }).catch(err => {
            console.error("Error al usar html2canvas:", err);
            toast.error("No se pudo generar la imagen del reporte.");
        }).finally(() => {
             setIsGenerating(false); // Asegurar que se quita el estado de carga
        });
    };

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Generar Reportes</h1>

            <div className="flex flex-col sm:flex-row gap-4 items-start mb-6 bg-surface p-4 rounded-lg shadow border border-border-color">
                {/* Selector de Fecha */}
                <div className='flex-1'>
                    <label htmlFor="reportDate" className="block text-sm font-medium text-text-secondary mb-1">
                        Fecha para Reporte:
                    </label>
                    <div className="relative">
                         <DatePicker
                             id="reportDate"
                             selected={selectedDate}
                             onChange={(date) => setSelectedDate(date || new Date())} // Evitar null date
                             dateFormat="dd 'de' MMMM, yyyy"
                             locale="es"
                             className="w-full pr-10" // Padding para icono
                             wrapperClassName="w-full"
                         />
                          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none" size={18} />
                     </div>
                     <p className="text-xs text-text-secondary mt-1">Selecciona cualquier día del mes para el reporte mensual.</p>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:pt-5 shrink-0">
                    <button
                        onClick={() => handleGenerateAndCapture('daily')}
                        disabled={isGenerating}
                        className="btn-secondary flex items-center justify-center gap-2 px-3 py-2"
                    >
                        <Download size={18} /> {isGenerating ? 'Generando...' : 'Diario (Imagen)'}
                    </button>
                    <button
                        onClick={() => handleGenerateAndCapture('monthly')}
                        disabled={isGenerating}
                        className="btn-secondary flex items-center justify-center gap-2 px-3 py-2"
                    >
                       <Download size={18} /> {isGenerating ? 'Generando...' : 'Mensual (Imagen)'}
                    </button>
                </div>
            </div>

             {/* Área oculta para renderizar el reporte justo antes de la captura */}
             {/* Se muestra brevemente mientras se captura */}
            <div className={`transition-opacity duration-100 ${reportData ? 'opacity-100' : 'opacity-0'}`}>
                 <div ref={reportRef} className="max-w-4xl mx-auto"> {/* Limitar ancho si es necesario */}
                    {reportData && <FinancialReport data={reportData} />}
                </div>
            </div>


        </div>
    );
}

export default ReportsPage;