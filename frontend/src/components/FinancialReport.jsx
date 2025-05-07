import { format, parseISO, isValid } from 'date-fns';
import es from 'date-fns/locale/es';

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (value == null || isNaN(numberValue)) return '$ 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numberValue);
};

const formatDate = (dateString, dateFormat = 'dd/MM/yyyy') => {
    if (!dateString) return 'Fecha inválida';
    try {
        const date = parseISO(dateString);
        if (isValid(date)) return format(date, dateFormat, { locale: es });
        const fallbackDate = new Date(dateString);
        if (isValid(fallbackDate)) return format(fallbackDate, dateFormat, { locale: es });
        return dateString?.split('T')[0] || 'Fecha inválida';
    } catch (e) { return dateString?.split('T')[0] || 'Fecha inválida'; }
};

function FinancialReport({ data }) {
    if (!data) return null;
    const totals = data.totals || { income: 0, expenses: 0, profit: 0 };
    const incomeDetails = Array.isArray(data.incomeDetails) ? data.incomeDetails : [];
    const expenseDetails = Array.isArray(data.expenseDetails) ? data.expenseDetails : [];
    const { type, date, year, month } = data;

    let reportTitle = 'Reporte Financiero';
    try {
        if (type === 'daily' && date) {
            const parsedDate = parseISO(date);
            reportTitle = isValid(parsedDate) ? `Reporte Diario - ${format(parsedDate, 'EEEE dd \'de\' MMMM, yyyy', { locale: es })}` : `Reporte Diario - ${date}`;
        } else if (type === 'monthly' && year && month) {
            const monthDate = new Date(year, month - 1, 1);
            reportTitle = isValid(monthDate) ? `Reporte Mensual - ${format(monthDate, 'MMMM yyyy', { locale: es })}` : `Reporte Mensual - ${year}/${String(month).padStart(2,'0')}`;
        }
    } catch (e) { console.error("Error creating report title:", e); }

    return (
        <div id="financial-report-container" className="p-4 sm:p-6 bg-white text-gray-800 font-sans rounded shadow-sm border border-gray-200 text-xs sm:text-sm">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-center border-b border-gray-300 pb-2 text-gray-700">{reportTitle}</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 text-center">
                <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                    <div className="text-[10px] sm:text-xs text-green-700 font-semibold uppercase tracking-wider mb-0.5">Ingresos</div>
                    <div className="text-base sm:text-lg font-bold text-green-800">{formatCurrency(totals.income)}</div>
                </div>
                <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                    <div className="text-[10px] sm:text-xs text-red-700 font-semibold uppercase tracking-wider mb-0.5">Gastos</div>
                    <div className="text-base sm:text-lg font-bold text-red-800">{formatCurrency(totals.expenses)}</div>
                </div>
                <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                    <div className="text-[10px] sm:text-xs text-blue-700 font-semibold uppercase tracking-wider mb-0.5">Beneficio</div>
                    <div className={`text-base sm:text-lg font-bold ${(totals.profit ?? 0) >= 0 ? 'text-blue-800' : 'text-red-800'}`}>{formatCurrency(totals.profit)}</div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-700 border-b pb-1 mb-1.5">Detalle de Ingresos</h3>
                    {incomeDetails.length > 0 ? (
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="border border-gray-300 px-1.5 py-1 text-left font-medium text-gray-600 text-[10px] sm:text-xs">Hora/Fecha</th>
                                    <th className="border border-gray-300 px-1.5 py-1 text-left font-medium text-gray-600 text-[10px] sm:text-xs">Cliente</th>
                                    <th className="border border-gray-300 px-1.5 py-1 text-left font-medium text-gray-600 text-[10px] sm:text-xs">Artista</th>
                                    <th className="border border-gray-300 px-1.5 py-1 text-left font-medium text-gray-600 text-[10px] sm:text-xs">Descripción</th>
                                    <th className="border border-gray-300 px-1.5 py-1 text-right font-medium text-gray-600 text-[10px] sm:text-xs">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {incomeDetails.map((item, index) => (
                                    <tr key={`inc-${item.id || index}`} className="hover:bg-gray-50">
                                        <td className="border-x border-gray-300 px-1.5 py-1 whitespace-nowrap">{formatDate(item.income_time, type === 'daily' ? 'HH:mm' : 'dd/MM HH:mm')}</td>
                                        <td className="border-x border-gray-300 px-1.5 py-1">{item.client_name || 'N/A'}</td>
                                        <td className="border-x border-gray-300 px-1.5 py-1">{item.artist_name || '-'}</td>
                                        <td className="border-x border-gray-300 px-1.5 py-1">{item.description || '-'}</td>
                                        <td className="border-x border-gray-300 px-1.5 py-1 text-right font-medium">{formatCurrency(item.income_amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-gray-500 italic mt-1 text-xs sm:text-sm">Sin ingresos registrados.</p>}
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-700 border-b pb-1 mb-1.5">Detalle de Gastos</h3>
                    {expenseDetails.length > 0 ? (
                         <table className="w-full border-collapse">
                             <thead className="bg-gray-50">
                                 <tr>
                                     {type === 'monthly' && <th className="border border-gray-300 px-1.5 py-1 text-left font-medium text-gray-600 text-[10px] sm:text-xs">Fecha</th>}
                                     <th className="border border-gray-300 px-1.5 py-1 text-left font-medium text-gray-600 text-[10px] sm:text-xs">Descripción</th>
                                     <th className="border border-gray-300 px-1.5 py-1 text-left font-medium text-gray-600 text-[10px] sm:text-xs">Categoría</th>
                                     <th className="border border-gray-300 px-1.5 py-1 text-right font-medium text-gray-600 text-[10px] sm:text-xs">Monto</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200">
                                 {expenseDetails.map((item, index) => (
                                     <tr key={`exp-${item.id || index}`} className="hover:bg-gray-50">
                                          {type === 'monthly' && <td className="border-x border-gray-300 px-1.5 py-1 whitespace-nowrap">{formatDate(item.expense_time || item.expense_date)}</td>}
                                         <td className="border-x border-gray-300 px-1.5 py-1">{item.description || '-'}</td>
                                         <td className="border-x border-gray-300 px-1.5 py-1">{item.category || '-'}</td>
                                         <td className="border-x border-gray-300 px-1.5 py-1 text-right font-medium">{formatCurrency(item.amount)}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : <p className="text-gray-500 italic mt-1 text-xs sm:text-sm">Sin gastos registrados.</p>}
                </div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-6 text-center">Reporte generado el {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
        </div>
    );
}

export default FinancialReport;