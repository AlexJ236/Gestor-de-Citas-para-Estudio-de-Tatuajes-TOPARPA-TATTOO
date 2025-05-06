const db = require('../config/db');

// Crear un nuevo gasto
exports.createExpense = async (req, res) => {
    const { description, amount, category, expense_date } = req.body;

    if (!description || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Descripción y monto válido son requeridos.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO expenses (description, amount, category, expense_date /*, user_id */)
             VALUES ($1, $2, $3, $4 /*, $5 */) RETURNING *`,
            [description, amount, category, expense_date || new Date()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear gasto:', err.message);
        res.status(500).json({ message: 'Error interno al crear gasto.' });
    }
};

// Obtener todos los gastos
exports.getAllExpenses = async (req, res) => {
    const { startDate, endDate } = req.query;
    let queryString = 'SELECT * FROM expenses';
    const queryParams = [];
    const conditions = [];

    if (startDate) {
        queryParams.push(startDate);
        conditions.push(`expense_date >= $${queryParams.length}`);
    }
    if (endDate) {
        queryParams.push(endDate);
        conditions.push(`expense_date <= $${queryParams.length}`);
    }

    if (conditions.length > 0) {
        queryString += ' WHERE ' + conditions.join(' AND ');
    }
    queryString += ' ORDER BY expense_date DESC, created_at DESC';

    try {
        const { rows } = await db.query(queryString, queryParams);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error al obtener gastos:', err.message);
        res.status(500).json({ message: 'Error interno al obtener gastos.' });
    }
};

// Obtener un gasto por ID
exports.getExpenseById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM expenses WHERE id = $1 /* AND user_id = $2 */', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Gasto no encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener gasto por ID:', err.message);
        res.status(500).json({ message: 'Error interno al obtener gasto.' });
    }
};

// Actualizar un gasto
exports.updateExpense = async (req, res) => {
    const { id } = req.params;
    const { description, amount, category, expense_date } = req.body;

    if (!description && !amount && !category && !expense_date) {
        return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar.' });
    }
    // Validar monto si se proporciona
    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
        return res.status(400).json({ message: 'El monto debe ser un número positivo.' });
    }

    try {
        const result = await db.query(
            `UPDATE expenses SET
                description = COALESCE($1, description),
                amount = COALESCE($2, amount),
                category = COALESCE($3, category),
                expense_date = COALESCE($4, expense_date),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $5 /* AND user_id = $6 */ RETURNING *`,
            [description, amount, category, expense_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Gasto no encontrado para actualizar.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar gasto:', err.message);
        res.status(500).json({ message: 'Error interno al actualizar gasto.' });
    }
};

// Eliminar un gasto
exports.deleteExpense = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM expenses WHERE id = $1 /* AND user_id = $2 */ RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Gasto no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Gasto eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar gasto:', err.message);
        res.status(500).json({ message: 'Error interno al eliminar gasto.' });
    }
};