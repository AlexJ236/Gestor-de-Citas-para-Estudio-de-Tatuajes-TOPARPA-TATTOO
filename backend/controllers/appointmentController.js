const db = require('../config/db');
const { isValid, parseISO } = require('date-fns');

// --- Helper Function checkTimeConflict (SIN CAMBIOS) ---
const checkTimeConflict = async (proposedStartTime, proposedDurationMinutes, excludingAppointmentId = null) => {
    if (!proposedStartTime || !proposedDurationMinutes || proposedDurationMinutes <= 0) { return false; }
    try {
        const startTime = new Date(proposedStartTime);
        if (!isValid(startTime)) throw new Error('Invalid start time object');
        const endTime = new Date(startTime.getTime() + proposedDurationMinutes * 60000);
        if (!isValid(endTime)) throw new Error('Invalid end time object');
        let conflictQuery = `
            SELECT id FROM appointments a WHERE a.status != 'canceled' AND a.duration_minutes IS NOT NULL AND a.duration_minutes > 0
            AND ($1 < (a.appointment_time + (a.duration_minutes * interval '1 minute'))) AND ($2 > a.appointment_time)
        `;
        const queryParams = [startTime.toISOString(), endTime.toISOString()];
        if (excludingAppointmentId !== null) {
            conflictQuery += ` AND a.id != $${queryParams.length + 1}`; queryParams.push(excludingAppointmentId);
        }
        const { rows } = await db.query(conflictQuery, queryParams); return rows.length > 0;
    } catch (error) { console.error("Error chequeando conflicto de horario:", error); throw new Error("Error al verificar disponibilidad de horario."); }
};


// --- Función de Crear Cita (SIN CAMBIOS DESDE LA ÚLTIMA VERSIÓN) ---
exports.createAppointment = async (req, res) => {
    const {
        client_id, appointment_time, duration_minutes, description,
        artist, total_price, amount_paid, payment_status, status
    } = req.body;
    const user_id = req.user.userId;

    if (!client_id || !appointment_time || !duration_minutes || duration_minutes <= 0) { return res.status(400).json({ message: 'ID de cliente, fecha/hora y duración válida son obligatorios' }); }
    if (!isValid(parseISO(appointment_time))) { return res.status(400).json({ message: 'Formato de fecha/hora inválido.' }); }

    try {
        const hasConflict = await checkTimeConflict(appointment_time, duration_minutes);
        if (hasConflict) { return res.status(409).json({ message: 'Conflicto de horario: El horario seleccionado ya está ocupado.' }); }

        const depositPaidAt = (amount_paid > 0 && payment_status === 'deposit_paid') ? new Date() : null;
        const completedAt = (status === 'completed') ? new Date() : null;

        const result = await db.query(
            `INSERT INTO appointments (
                client_id, user_id, appointment_time, duration_minutes, description, artist,
                total_price, amount_paid, payment_status, status,
                deposit_paid_at, completed_at, created_at -- Asumiendo updated_at no existe o se maneja por trigger/default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP) RETURNING *`,
            [
                client_id, user_id, appointment_time, duration_minutes, description, artist,
                total_price, amount_paid, payment_status || 'pending', status || 'scheduled',
                depositPaidAt, completedAt
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23503') { return res.status(400).json({ message: 'El ID de cliente proporcionado no existe' }); }
        if (err.message === "Error al verificar disponibilidad de horario.") { return res.status(500).json({ message: err.message }); }
        console.error('Error al crear cita:', err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear cita' });
    }
};


// --- Función de Actualizar Cita (CON LOGGING ADICIONAL PARA TIMESTAMPS) ---
exports.updateAppointment = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    if (Object.keys(body).length === 0) { return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar.' }); }
    if (body.appointment_time && !isValid(parseISO(body.appointment_time))) { return res.status(400).json({ message: 'Formato de fecha/hora inválido.' }); }

    try {
        const currentAppointmentResult = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
        if (currentAppointmentResult.rows.length === 0) { return res.status(404).json({ message: 'Cita no encontrada' }); }
        const currentAppointment = currentAppointmentResult.rows[0];

        const timeToCheck = body.appointment_time !== undefined ? body.appointment_time : currentAppointment.appointment_time?.toISOString();
        const durationToCheck = body.duration_minutes !== undefined ? body.duration_minutes : currentAppointment.duration_minutes;
        let conflictCheckNeeded = false;
        if (body.appointment_time !== undefined && body.appointment_time !== currentAppointment.appointment_time?.toISOString()) { conflictCheckNeeded = true; }
        if (body.duration_minutes !== undefined && body.duration_minutes !== currentAppointment.duration_minutes) { conflictCheckNeeded = true; }

        if (conflictCheckNeeded && timeToCheck && durationToCheck > 0) {
             const validTimeToCheck = parseISO(timeToCheck);
             if (isValid(validTimeToCheck)) {
                const hasConflict = await checkTimeConflict(validTimeToCheck, durationToCheck, id);
                if (hasConflict) { return res.status(409).json({ message: 'Conflicto de horario: El nuevo horario seleccionado ya está ocupado por otra cita.' }); }
            } else { console.warn(`Skipping conflict check due to invalid timeToCheck: ${timeToCheck}`); }
        }

        // *** LOGGING Y LÓGICA PARA TIMESTAMPS ***
        console.log(`[Update ID: ${id}] Datos recibidos:`, body);
        console.log(`[Update ID: ${id}] Datos actuales DB: status=${currentAppointment.status}, payment_status=${currentAppointment.payment_status}, deposit_paid_at=${currentAppointment.deposit_paid_at}, completed_at=${currentAppointment.completed_at}`);

        let finalDepositPaidAt = currentAppointment.deposit_paid_at;
        const conditionDeposit = body.payment_status === 'deposit_paid' && currentAppointment.payment_status !== 'deposit_paid' && !finalDepositPaidAt;
        console.log(`[Update ID: ${id}] Condición para setear deposit_paid_at (${conditionDeposit}): nuevo_status=${body.payment_status}, viejo_status=${currentAppointment.payment_status}, fecha_existente=${finalDepositPaidAt}`);
        if (conditionDeposit) {
            const currentAmountPaid = body.amount_paid !== undefined ? body.amount_paid : currentAppointment.amount_paid;
            if (currentAmountPaid > 0) {
                finalDepositPaidAt = new Date();
                console.log(`[Update ID: ${id}] SETEANDO deposit_paid_at a:`, finalDepositPaidAt);
            } else {
                 console.log(`[Update ID: ${id}] NO seteando deposit_paid_at (amount_paid <= 0)`);
            }
        }

        let finalCompletedAt = currentAppointment.completed_at;
        const conditionCompleted = body.status === 'completed' && currentAppointment.status !== 'completed' && !finalCompletedAt;
        console.log(`[Update ID: ${id}] Condición para setear completed_at (${conditionCompleted}): nuevo_status=${body.status}, viejo_status=${currentAppointment.status}, fecha_existente=${finalCompletedAt}`);
        if (conditionCompleted) {
            finalCompletedAt = new Date();
             console.log(`[Update ID: ${id}] SETEANDO completed_at a:`, finalCompletedAt);
        }
        // *** FIN LOGGING Y LÓGICA TIMESTAMPS ***

        const values = [
            body.client_id !== undefined ? body.client_id : null,
            body.appointment_time !== undefined ? body.appointment_time : null,
            body.duration_minutes !== undefined ? body.duration_minutes : null,
            body.description !== undefined ? body.description : null,
            body.artist !== undefined ? body.artist : null,
            body.total_price !== undefined ? body.total_price : null,
            body.amount_paid !== undefined ? body.amount_paid : null,
            body.payment_status !== undefined ? body.payment_status : null,
            body.status !== undefined ? body.status : null,
            finalDepositPaidAt,
            finalCompletedAt,
            id
        ];

        // Query sin updated_at (según la corrección anterior)
        const updateQuery = `
            UPDATE appointments SET
                client_id = COALESCE($1, client_id),
                appointment_time = COALESCE($2, appointment_time),
                duration_minutes = COALESCE($3, duration_minutes),
                description = COALESCE($4, description),
                artist = COALESCE($5, artist),
                total_price = COALESCE($6, total_price),
                amount_paid = COALESCE($7, amount_paid),
                payment_status = COALESCE($8, payment_status),
                status = COALESCE($9, status),
                deposit_paid_at = COALESCE($10, deposit_paid_at),
                completed_at = COALESCE($11, completed_at)
            WHERE id = $12
            RETURNING *
        `;

        console.log("--- Ejecutando UPDATE Appointment ---");
        console.log("ID:", id);
        // console.log("Query:", updateQuery); // Opcional: descomentar si necesitas ver la query de nuevo
        console.log("Valores Finales:", values);

        const result = await db.query(updateQuery, values);

        if (result.rows.length === 0) {
             return res.status(404).json({ message: 'Cita no encontrada después de intentar actualizar (inesperado).' });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(`Error en updateAppointment (ID: ${id}):`, err);
        if (err.code === '23503') { return res.status(400).json({ message: `Error de referencia: ${err.detail || 'El ID de cliente podría ser inválido'}` }); }
        if (err.message === "Error al verificar disponibilidad de horario.") { return res.status(500).json({ message: err.message }); }
        res.status(500).json({ message: 'Error interno del servidor al actualizar cita.' });
    }
};


// --- OBTENER TODAS LAS CITAS (SIN CAMBIOS) ---
exports.getAllAppointments = async (req, res) => { /* ...código anterior... */ };
// --- OBTENER CITA POR ID (SIN CAMBIOS) ---
exports.getAppointmentById = async (req, res) => { /* ...código anterior... */ };
// --- ELIMINAR CITA (SIN CAMBIOS) ---
exports.deleteAppointment = async (req, res) => { /* ...código anterior... */ };

// --- Mantener el código existente para las funciones no modificadas ---
exports.getAllAppointments = async (req, res) => {
    try {
        const query = `
            SELECT a.*, c.name as client_name
            FROM appointments a
            LEFT JOIN clients c ON a.client_id = c.id
            ORDER BY a.appointment_time ASC
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener citas:', err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener citas' });
    }
};
exports.getAppointmentById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT a.*, c.name as client_name
            FROM appointments a
            LEFT JOIN clients c ON a.client_id = c.id
            WHERE a.id = $1
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`Error al obtener cita por ID (${id}):`, err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener cita por ID' });
    }
};
exports.deleteAppointment = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        res.status(200).json({ message: 'Cita eliminada exitosamente' });
    } catch (err) {
        console.error(`Error al eliminar cita (${id}):`, err.message, err.stack);
        if (err.code === '23503') {
             return res.status(409).json({ message: 'Conflicto: No se puede eliminar la cita, puede tener registros relacionados.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al eliminar cita' });
    }
};