const db = require('../config/db');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, parse, isValid, formatISO } = require('date-fns');

// --- Helper validateDateParams ---
const validateDateParams = (year, month, day = null) => {
    const y = parseInt(year); const m = parseInt(month); const d = day ? parseInt(day) : 1;
    if (isNaN(y) || isNaN(m) || (day !== null && isNaN(d)) || m < 1 || m > 12 || d < 1 || d > 31) { return { valid: false, message: 'Parámetros de fecha inválidos o faltantes.' }; }
    const dateString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const referenceDate = parse(dateString, 'yyyy-MM-dd', new Date());
    if (!isValid(referenceDate)) { return { valid: false, message: 'Fecha inválida.' }; }
    return { valid: true, referenceDate };
};

// --- Resumen Financiero ---
exports.getFinancialSummary = async (req, res) => {
    const { year, month } = req.query;
    const validation = validateDateParams(year, month);
    if (!validation.valid) { return res.status(400).json({ message: validation.message }); }
    const startDate = startOfMonth(validation.referenceDate);
    const endDate = endOfMonth(validation.referenceDate);
    const todayStart = startOfDay(new Date());

    console.log(`[getFinancialSummary] Calculando para ${year}-${month}`);
    console.log(` -> StartDate (DB): ${startDate.toISOString()}`);
    console.log(` -> EndDate (DB):   ${endDate.toISOString()}`);
    try {
        // Cálculos de totales directos para el resumen
        const depositResult = await db.query(`SELECT COALESCE(SUM(amount_paid), 0) as total_deposit_income FROM appointments WHERE payment_status = 'deposit_paid' AND amount_paid > 0 AND deposit_paid_at >= $1 AND deposit_paid_at <= $2`, [startDate, endDate]);
        const depositIncome = parseFloat(depositResult.rows[0]?.total_deposit_income || 0);
        const balanceResult = await db.query(`SELECT COALESCE(SUM(CASE WHEN deposit_paid_at < $1 THEN GREATEST(0, COALESCE(total_price, 0) - COALESCE(amount_paid, 0)) ELSE COALESCE(total_price, 0) END), 0) as total_balance_income FROM appointments WHERE status = 'completed' AND completed_at >= $1 AND completed_at <= $2`, [startDate, endDate]);
        const balanceIncome = parseFloat(balanceResult.rows[0]?.total_balance_income || 0);
        const totalIncome = depositIncome + balanceIncome;
        const expenseResult = await db.query(`SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE expense_date >= $1 AND expense_date <= $2`, [startDate, endDate]);
        const expenses = parseFloat(expenseResult.rows[0]?.total_expenses || 0);
        const profit = totalIncome - expenses;
        const pendingResult = await db.query(`SELECT COALESCE(SUM(total_price - amount_paid), 0) as total_pending FROM appointments WHERE status = 'scheduled' AND payment_status = 'deposit_paid' AND appointment_time >= $1 AND total_price > amount_paid`, [todayStart]);
        const pendingBalance = parseFloat(pendingResult.rows[0]?.total_pending || 0);

        console.log(`[getFinancialSummary ${year}-${month}] Totals: Income=${totalIncome}, Expenses=${expenses}, Profit=${profit}, Pending=${pendingBalance}`);
        res.status(200).json({ year, month, income: totalIncome, expenses, profit, pendingBalance });
    } catch (err) {
        console.error(`Error específico en getFinancialSummary (${year}-${month}):`, err);
        res.status(500).json({ message: 'Error interno al generar resumen financiero.' });
    }
};

// --- Reporte Diario ---
exports.getDailyReportData = async (req, res) => {
    const { year, month, day } = req.query;
    const validation = validateDateParams(year, month, day);
    if (!validation.valid) { return res.status(400).json({ message: validation.message }); }
    const startDate = startOfDay(validation.referenceDate);
    const endDate = endOfDay(validation.referenceDate);

    console.log(`[getDailyReportData] Calculando para ${year}-${month}-${day}`);
    console.log(` -> StartDate (DB): ${startDate.toISOString()}`);
    console.log(` -> EndDate (DB):   ${endDate.toISOString()}`);
    try {
        // 1. Detalles de Adelantos
        console.log(" -> Querying deposit details...");
        const depositDetailsRes = await db.query(
            `SELECT a.id, a.deposit_paid_at as income_time, a.amount_paid as income_amount, c.name as client_name, 'Adelanto Cita' as description
             FROM appointments a JOIN clients c ON a.client_id = c.id
             WHERE a.payment_status = 'deposit_paid' AND a.amount_paid > 0 AND a.deposit_paid_at >= $1 AND a.deposit_paid_at <= $2`,
            [startDate, endDate]
        );
        console.log(` -> Found ${depositDetailsRes.rowCount} deposit details.`);

        // 2. Detalles de Citas completadas
         console.log(" -> Querying completion details...");
         const balanceDetailsRes = await db.query(
            `SELECT a.id, a.completed_at as income_time, COALESCE(a.total_price, 0) as income_amount, c.name as client_name, 'Cita Completada' as description
             FROM appointments a JOIN clients c ON a.client_id = c.id
             WHERE a.status = 'completed' AND a.completed_at >= $1 AND a.completed_at <= $2`,
            [startDate, endDate]
        );
        console.log(` -> Found ${balanceDetailsRes.rowCount} completion details.`);

        // Combinar y ordenar
        const incomeDetails = [...depositDetailsRes.rows, ...balanceDetailsRes.rows]
            .sort((a,b) => (a.income_time && b.income_time) ? new Date(a.income_time) - new Date(b.income_time) : 0);
        console.log(` -> Combined Income Details: ${incomeDetails.length}`);

        // Gastos
         console.log(" -> Querying expense details...");
         const expenseRes = await db.query(
             `SELECT id, description, category, amount, expense_date as expense_time FROM expenses
              WHERE expense_date >= $1 AND expense_date <= $2 ORDER BY expense_date, created_at`,
             [startDate, endDate]
         );
        console.log(` -> Found ${expenseRes.rowCount} expense details.`);

        // Calcular totales A PARTIR DE LOS DETALLES OBTENIDOS
         console.log(" -> Calculating totals from details...");
         const totalIncome = incomeDetails.reduce((sum, item) => sum + (Number(item.income_amount) || 0), 0);
         const totalExpenses = expenseRes.rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
         const profit = totalIncome - totalExpenses;
        console.log(` -> Totals: Income=${totalIncome}, Expenses=${totalExpenses}, Profit=${profit}`);

        // *** LOGGING ANTES DE ENVIAR ***
        console.log(` -> Sending incomeDetails:`, JSON.stringify(incomeDetails, null, 2));
        console.log(` -> Sending totals: Income=${totalIncome}, Expenses=${totalExpenses}, Profit=${profit}`);
        // *** FIN LOGGING ***

        res.status(200).json({
            type: 'daily', date: formatISO(validation.referenceDate, { representation: 'date' }),
            incomeDetails,
            expenseDetails: expenseRes.rows,
            totals: { income: totalIncome, expenses: totalExpenses, profit: profit }
        });
    } catch (err) {
        console.error(`Error específico en getDailyReportData (${year}-${month}-${day}):`, err);
        res.status(500).json({ message: 'Error interno al generar reporte diario.' });
    }
};

// --- Reporte Mensual ---
exports.getMonthlyReportData = async (req, res) => {
     const { year, month } = req.query;
     const validation = validateDateParams(year, month);
     if (!validation.valid) { return res.status(400).json({ message: validation.message }); }
     const startDate = startOfMonth(validation.referenceDate);
     const endDate = endOfMonth(validation.referenceDate);

     console.log(`[getMonthlyReportData] Calculando para ${year}-${month}`);
     console.log(` -> StartDate (DB): ${startDate.toISOString()}`);
     console.log(` -> EndDate (DB):   ${endDate.toISOString()}`);
     try {
          // Detalles de Ingresos
          console.log(" -> Querying deposit details...");
          const depositDetailsRes = await db.query(
              `SELECT a.id, a.deposit_paid_at as income_time, a.amount_paid as income_amount, c.name as client_name, 'Adelanto Cita' as description FROM appointments a JOIN clients c ON a.client_id = c.id WHERE a.payment_status = 'deposit_paid' AND a.amount_paid > 0 AND a.deposit_paid_at >= $1 AND a.deposit_paid_at <= $2`,
              [startDate, endDate]
          );
           console.log(` -> Found ${depositDetailsRes.rowCount} deposit details.`);

          console.log(" -> Querying completion details...");
          const balanceDetailsRes = await db.query(
             `SELECT a.id, a.completed_at as income_time, COALESCE(a.total_price, 0) as income_amount, c.name as client_name, 'Cita Completada' as description FROM appointments a JOIN clients c ON a.client_id = c.id WHERE a.status = 'completed' AND a.completed_at >= $1 AND a.completed_at <= $2`,
             [startDate, endDate]
          );
            console.log(` -> Found ${balanceDetailsRes.rowCount} completion details.`);

         // Combinar y ordenar
         const incomeDetails = [...depositDetailsRes.rows, ...balanceDetailsRes.rows]
             .sort((a, b) => (a.income_time && b.income_time) ? new Date(a.income_time) - new Date(b.income_time) : 0);
         console.log(` -> Combined Income Details: ${incomeDetails.length}`);

          // Gastos
          console.log(" -> Querying expense details...");
          const expenseRes = await db.query(
               `SELECT id, description, category, amount, expense_date as expense_time FROM expenses WHERE expense_date >= $1 AND expense_date <= $2 ORDER BY expense_date, created_at`,
               [startDate, endDate]
           );
          console.log(` -> Found ${expenseRes.rowCount} expense details.`);

          // Calcular totales A PARTIR DE LOS DETALLES OBTENIDOS
          console.log(" -> Calculating totals from details...");
          const totalIncome = incomeDetails.reduce((sum, item) => sum + (Number(item.income_amount) || 0), 0);
          const totalExpenses = expenseRes.rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const profit = totalIncome - totalExpenses;
          console.log(` -> Totals: Income=${totalIncome}, Expenses=${totalExpenses}, Profit=${profit}`);
          console.log(` -> Sending incomeDetails:`, JSON.stringify(incomeDetails, null, 2));
          console.log(` -> Sending totals: Income=${totalIncome}, Expenses=${totalExpenses}, Profit=${profit}`);

          res.status(200).json({
              type: 'monthly', year: year, month: month,
              incomeDetails,
              expenseDetails: expenseRes.rows,
              totals: { income: totalIncome, expenses: totalExpenses, profit: profit }
          });
      } catch (err) {
          console.error(`Error específico en getMonthlyReportData (${year}-${month}):`, err);
          res.status(500).json({ message: 'Error interno al generar reporte mensual.' });
      }
};