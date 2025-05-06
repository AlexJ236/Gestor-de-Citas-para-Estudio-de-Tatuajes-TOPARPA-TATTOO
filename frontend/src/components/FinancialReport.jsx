import { format, parseISO } from 'date-fns';
import es from 'date-fns/locale/es';

// Helper para formatear moneda
const formatCurrency = (value) => {
  const numberValue = Number(value); // Intentar convertir a número
  if (value == null || isNaN(numberValue)) { // Verificar null, undefined, o si no es un número válido
      return '$ 0';
  }
  // Formatear solo si es un número válido
  return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
  }).format(numberValue);
};

// Helper para formatear fechas
const formatDate = (dateString, dateFormat = 'dd/MM/yyyy') => {
    if (!dateString) return 'Fecha inválida'; // Manejar string vacío o nulo
    try {
        const date = parseISO(dateString); // parseISO es bueno para formato ISO del backend
        if (date instanceof Date && !isNaN(date)) {
             return format(date, dateFormat, { locale: es });
        }
        // Intentar fallback si no es ISO estricto
        const fallbackDate = new Date(dateString);
         if (fallbackDate instanceof Date && !isNaN(fallbackDate)) {
              console.warn("Used fallback Date constructor for:", dateString);
              return format(fallbackDate, dateFormat, { locale: es });
         }
        throw new Error("Invalid date parsed");
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        // Devolver algo neutral o el string original si falla
        return dateString?.split('T')[0] || 'Fecha inválida';
    }
};

function FinancialReport({ data }) {
    if (!data) {
        console.warn("FinancialReport rendered without data.");
        return null;
    }

    // Desestructurar con valores por defecto más seguros
    const totals = data.totals || { income: 0, expenses: 0, profit: 0 };
    const incomeDetails = Array.isArray(data.incomeDetails) ? data.incomeDetails : [];
    const expenseDetails = Array.isArray(data.expenseDetails) ? data.expenseDetails : [];
    const { type, date, year, month } = data;

    let reportTitle = 'Reporte Financiero';
    try {
        if (type === 'daily' && date) {
            reportTitle = `Reporte Diario - ${formatDate(date)}`;
        } else if (type === 'monthly' && year && month) {
            const monthDate = new Date(year, month - 1, 1);
            if (monthDate instanceof Date && !isNaN(monthDate)) {
                reportTitle = `Reporte Mensual - ${format(monthDate, 'MMMM yyyy', { locale: es })}`;
            } else {
                 reportTitle = `Reporte Mensual - ${year}/${String(month).padStart(2,'0')}`; // Mejor fallback
            }
        }
    } catch (e) {
         console.error("Error creating report title:", e);
    }

    return (
        <div id="financial-report-container" className="p-6 bg-white text-gray-800 font-sans rounded shadow-sm border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center border-b border-gray-300 pb-3 text-gray-700">{reportTitle}</h2>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 text-center">
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                    <div className="text-xs sm:text-sm text-green-700 font-semibold uppercase tracking-wider mb-1">Ingresos</div>
                    <div className="text-lg sm:text-xl font-bold text-green-800">{formatCurrency(totals.income)}</div>
                </div>
                <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                    <div className="text-xs sm:text-sm text-red-700 font-semibold uppercase tracking-wider mb-1">Gastos</div>
                    <div className="text-lg sm:text-xl font-bold text-red-800">{formatCurrency(totals.expenses)}</div>
                </div>
                <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                    <div className="text-xs sm:text-sm text-blue-700 font-semibold uppercase tracking-wider mb-1">Beneficio</div>
                    <div className={`text-lg sm:text-xl font-bold ${(totals.profit ?? 0) >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                        {formatCurrency(totals.profit)}
                    </div>
                </div>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detalle Ingresos */}
                <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 border-b pb-1 mb-2">Detalle de Ingresos</h3>
                    {incomeDetails.length > 0 ? (
                        <table className="w-full text-xs sm:text-sm border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-600">Hora/Fecha</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-600">Cliente</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-600">Descripción</th>
                                    <th className="border border-gray-300 px-2 py-1 text-right font-medium text-gray-600">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {incomeDetails.map((item, index) => (
                                    <tr key={`inc-${item.id || index}`} className="hover:bg-gray-50">
                                        <td className="border-x border-gray-300 px-2 py-1.5 whitespace-nowrap">{formatDate(item.income_time, type === 'daily' ? 'HH:mm' : 'dd/MM HH:mm')}</td>
                                        <td className="border-x border-gray-300 px-2 py-1.5">{item.client_name || 'N/A'}</td>
                                        <td className="border-x border-gray-300 px-2 py-1.5">{item.description || '-'}</td>
                                        <td className="border-x border-gray-300 px-2 py-1.5 text-right font-medium">{formatCurrency(item.income_amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-gray-500 italic mt-2 text-sm">Sin ingresos registrados.</p>}
                </div>

                {/* Detalle Gastos */}
                <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 border-b pb-1 mb-2">Detalle de Gastos</h3>
                    {expenseDetails.length > 0 ? (
                         <table className="w-full text-xs sm:text-sm border-collapse">
                             <thead className="bg-gray-50">
                                 <tr>
                                     {type === 'monthly' && <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-600">Fecha</th>}
                                     <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-600">Descripción</th>
                                     <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-600">Categoría</th>
                                     <th className="border border-gray-300 px-2 py-1 text-right font-medium text-gray-600">Monto</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200">
                                 {expenseDetails.map((item, index) => (
                                     <tr key={`exp-${item.id || index}`} className="hover:bg-gray-50">
                                          {type === 'monthly' && <td className="border-x border-gray-300 px-2 py-1.5 whitespace-nowrap">{formatDate(item.expense_time || item.expense_date)}</td>}
                                         <td className="border-x border-gray-300 px-2 py-1.5">{item.description || '-'}</td>
                                         <td className="border-x border-gray-300 px-2 py-1.5">{item.category || '-'}</td>
                                         <td className="border-x border-gray-300 px-2 py-1.5 text-right font-medium">{formatCurrency(item.amount)}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : <p className="text-gray-500 italic mt-2 text-sm">Sin gastos registrados.</p>}
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-8 text-center">Reporte generado el {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
        </div>
    );
}

export default FinancialReport;