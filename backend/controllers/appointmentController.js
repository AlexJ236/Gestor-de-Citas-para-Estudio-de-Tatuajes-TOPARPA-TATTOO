const db = require('../config/db');
const { isValid, parseISO, startOfDay, setHours, setMinutes } = require('date-fns');

/**
 * Helper para verificar conflictos de horario para un artista específico.
 * @param {string} proposedStartTime - ISO String de la hora de inicio propuesta.
 * @param {number} proposedDurationMinutes - Duración en minutos.
 * @param {number} artistId - ID del artista para el que se verifica el conflicto.
 * @param {number|null} [excludingAppointmentId=null] - ID de la cita a excluir de la verificación.
 * @returns {Promise<boolean>} - true si hay conflicto, false si no.
 * @throws {Error} - Si hay un error en la consulta o parámetros inválidos.
 */
const checkTimeConflict = async (proposedStartTime, proposedDurationMinutes, artistId, excludingAppointmentId = null) => {
    // Validar parámetros de entrada
    if (!proposedStartTime || !proposedDurationMinutes || proposedDurationMinutes <= 0 || !artistId) {
        console.warn("checkTimeConflict: Parámetros inválidos o faltantes (hora, duración o ID de artista).", { proposedStartTime, proposedDurationMinutes, artistId });
  
        return false; // Opción actual basada en implementación previa, revisar si es segura.
    }

    try {
        const startTime = new Date(proposedStartTime);
        if (!isValid(startTime)) throw new Error('Fecha/Hora de inicio inválida');

        const endTime = new Date(startTime.getTime() + Number(proposedDurationMinutes) * 60000); // Asegurar que duration es número
        if (!isValid(endTime)) throw new Error('Fecha/Hora de fin inválida (calculada)');

        // Consulta para encontrar citas del MISMO artista que se solapen en el tiempo
        let conflictQuery = `
            SELECT id FROM appointments a
            WHERE
                a.status != 'canceled'                       -- Ignorar citas canceladas
                AND a.artist_id = $1                         -- Solo citas del mismo artista
                AND a.appointment_time IS NOT NULL           -- Asegurar que la hora existe
                AND a.duration_minutes IS NOT NULL AND a.duration_minutes > 0 -- Asegurar que la duración existe y es válida
                AND ($2, $3) OVERLAPS (a.appointment_time, a.appointment_time + (a.duration_minutes * interval '1 minute')) -- Usar OVERLAPS para simplificar
        `;
        // Parámetros iniciales: artistId, startTime ISO, endTime ISO
        const queryParams = [artistId, startTime.toISOString(), endTime.toISOString()];

        // Si estamos actualizando, excluimos la cita actual de la verificación
        if (excludingAppointmentId !== null) {
            conflictQuery += ` AND a.id != $${queryParams.length + 1}`; // Añadir condición para excluir
            queryParams.push(excludingAppointmentId); // Añadir el ID a excluir a los parámetros
        }

        const { rows } = await db.query(conflictQuery, queryParams);

        return rows.length > 0; // Devuelve true si encontró alguna fila (hay conflicto)

    } catch (error) {
        console.error("Error chequeando conflicto de horario:", error.message, error.stack);
        // Lanzar un error más específico o genérico para que sea manejado por el controlador que llama
        throw new Error("Error interno al verificar disponibilidad de horario.");
    }
};


// --- Crear Cita ---
exports.createAppointment = async (req, res) => {
    // Obtener datos del body, esperando artist_id en lugar de artist
    const {
        client_id, appointment_time, duration_minutes, description,
        artist_id, // Se espera ID del artista
        total_price, amount_paid, payment_status, status
    } = req.body;
    const user_id = req.user.userId; // Asumiendo que authenticateToken añade userId

    // Validación de campos obligatorios, incluyendo artist_id
    if (!client_id || !appointment_time || !artist_id || !duration_minutes || duration_minutes <= 0) {
        return res.status(400).json({ message: 'ID de cliente, ID de artista, fecha/hora y duración válida son obligatorios.' });
    }
    if (!isValid(parseISO(appointment_time))) {
        return res.status(400).json({ message: 'Formato de fecha/hora inválido.' });
    }

    try {
        // Verificar conflicto de horario PARA EL ARTISTA específico
        const hasConflict = await checkTimeConflict(appointment_time, duration_minutes, artist_id);
        if (hasConflict) {
            return res.status(409).json({ message: 'Conflicto de horario: El artista seleccionado ya tiene una cita en ese horario.' });
        }

        // Determinar timestamps basados en estado y pago
        const depositPaidAt = (amount_paid > 0 && payment_status === 'deposit_paid') ? new Date() : null;
        const completedAt = (status === 'completed') ? new Date() : null;

        // Insertar en la base de datos usando artist_id
        const result = await db.query(
            `INSERT INTO appointments (
                client_id, user_id, appointment_time, duration_minutes, description, artist_id,
                total_price, amount_paid, payment_status, status,
                deposit_paid_at, completed_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
            [
                client_id, user_id, appointment_time, parseInt(duration_minutes, 10), description, artist_id,
                total_price, amount_paid, payment_status || 'pending', status || 'scheduled',
                depositPaidAt, completedAt
            ]
        );
        res.status(201).json(result.rows[0]);

    } catch (err) {
        // Manejo de errores específicos y genéricos
        if (err.code === '23503') { // Error de Foreign Key (ej. client_id o artist_id no existe)
            if (err.constraint && err.constraint.includes('client_id')) {
                 return res.status(400).json({ message: 'Error: El ID de cliente proporcionado no existe.' });
            }
            if (err.constraint && err.constraint.includes('artist_id')) {
                return res.status(400).json({ message: 'Error: El ID de artista proporcionado no existe.' });
           }
            return res.status(400).json({ message: `Error de referencia: ${err.detail || 'ID inválido.'}` });
        }
        if (err.message.includes("disponibilidad de horario")) { // Error lanzado por checkTimeConflict
            return res.status(500).json({ message: err.message });
        }
        console.error('Error al crear cita:', err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear cita.' });
    }
};

// --- Actualizar Cita ---
exports.updateAppointment = async (req, res) => {
    const { id } = req.params; // ID de la cita a actualizar
    const body = req.body; // Datos enviados en la petición

    // Validar que se envíe al menos un campo
    if (Object.keys(body).length === 0) {
        return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar.' });
    }
    // Validar formato de fecha si se proporciona
    if (body.appointment_time && !isValid(parseISO(body.appointment_time))) {
        return res.status(400).json({ message: 'Formato de fecha/hora inválido.' });
    }

    try {
        // Obtener el estado actual de la cita
        const currentAppointmentResult = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
        if (currentAppointmentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada.' });
        }
        const currentAppointment = currentAppointmentResult.rows[0];

        // Determinar si se necesita verificar conflicto y con qué datos
        const proposedArtistId = body.artist_id !== undefined ? body.artist_id : currentAppointment.artist_id;
        const proposedAppointmentTime = body.appointment_time !== undefined ? body.appointment_time : currentAppointment.appointment_time?.toISOString();
        const proposedDurationMinutes = body.duration_minutes !== undefined ? body.duration_minutes : currentAppointment.duration_minutes;

        let conflictCheckNeeded = false;
        // Se necesita verificar si cambia la hora, la duración o el artista
        if ( (body.appointment_time !== undefined && body.appointment_time !== currentAppointment.appointment_time?.toISOString()) ||
             (body.duration_minutes !== undefined && Number(body.duration_minutes) !== currentAppointment.duration_minutes) || // Comparar como número
             (body.artist_id !== undefined && Number(body.artist_id) !== currentAppointment.artist_id) ) { // Comparar como número
            conflictCheckNeeded = true;
        }

        // Realizar la verificación de conflicto si es necesario
        if (conflictCheckNeeded) {
             // Asegurarse de tener datos válidos para la verificación
             if (proposedAppointmentTime && proposedDurationMinutes > 0 && proposedArtistId) {
                const validTimeToCheck = parseISO(proposedAppointmentTime);
                if (isValid(validTimeToCheck)) {
                    // Llamar a checkTimeConflict excluyendo la cita actual (pasando el ID)
                    const hasConflict = await checkTimeConflict(validTimeToCheck, proposedDurationMinutes, proposedArtistId, id);
                    if (hasConflict) {
                        return res.status(409).json({ message: 'Conflicto de horario: El artista seleccionado ya tiene una cita en el nuevo horario.' });
                    }
                } else {
                    console.warn(`Skipping conflict check due to invalid timeToCheck: ${proposedAppointmentTime}`);
                    // Considerar si esto debería ser un error 400 en lugar de solo una advertencia
                }
            } else {
                 console.warn("Skipping conflict check due to missing parameters during update.", { proposedAppointmentTime, proposedDurationMinutes, proposedArtistId });
                 // Podría ser un error 400 si se intentó cambiar artista/hora/duración sin los datos completos
            }
        }

        // Determinar timestamps (deposit_paid_at, completed_at)
        let finalDepositPaidAt = currentAppointment.deposit_paid_at;
        const conditionDeposit = body.payment_status === 'deposit_paid' && currentAppointment.payment_status !== 'deposit_paid' && !finalDepositPaidAt;
        if (conditionDeposit) {
            const currentAmountPaid = body.amount_paid !== undefined ? body.amount_paid : currentAppointment.amount_paid;
            if (currentAmountPaid > 0) { finalDepositPaidAt = new Date(); }
        }

        let finalCompletedAt = currentAppointment.completed_at;
        const conditionCompleted = body.status === 'completed' && currentAppointment.status !== 'completed' && !finalCompletedAt;
        if (conditionCompleted) { finalCompletedAt = new Date(); }

        // Construir la consulta UPDATE
        // Crear arrays para partes SET y valores dinámicamente
        const setClauses = [];
        const values = [];
        let valueIndex = 1;

        // Añadir campos al SET y values solo si están presentes en el body
        if (body.client_id !== undefined) { setClauses.push(`client_id = $${valueIndex++}`); values.push(body.client_id); }
        if (body.appointment_time !== undefined) { setClauses.push(`appointment_time = $${valueIndex++}`); values.push(body.appointment_time); }
        if (body.duration_minutes !== undefined) { setClauses.push(`duration_minutes = $${valueIndex++}`); values.push(parseInt(body.duration_minutes, 10)); }
        if (body.description !== undefined) { setClauses.push(`description = $${valueIndex++}`); values.push(body.description); }
        if (body.artist_id !== undefined) { setClauses.push(`artist_id = $${valueIndex++}`); values.push(body.artist_id); } // Cambiado a artist_id
        if (body.total_price !== undefined) { setClauses.push(`total_price = $${valueIndex++}`); values.push(body.total_price); }
        if (body.amount_paid !== undefined) { setClauses.push(`amount_paid = $${valueIndex++}`); values.push(body.amount_paid); }
        if (body.payment_status !== undefined) { setClauses.push(`payment_status = $${valueIndex++}`); values.push(body.payment_status); }
        if (body.status !== undefined) { setClauses.push(`status = $${valueIndex++}`); values.push(body.status); }

        // Añadir timestamps calculados si cambiaron (solo se actualizan si pasan de null a una fecha)
        if (finalDepositPaidAt && finalDepositPaidAt !== currentAppointment.deposit_paid_at) { setClauses.push(`deposit_paid_at = $${valueIndex++}`); values.push(finalDepositPaidAt); }
        if (finalCompletedAt && finalCompletedAt !== currentAppointment.completed_at) { setClauses.push(`completed_at = $${valueIndex++}`); values.push(finalCompletedAt); }

        // Siempre actualizar 'updated_at'
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        if (setClauses.length === 1 && setClauses[0] === 'updated_at = CURRENT_TIMESTAMP') {
             console.log(`Update request for appointment ${id} had no effective changes.`);
        }


        // Añadir el ID de la cita al final del array de valores para la cláusula WHERE
        values.push(id);
        const whereClauseIndex = valueIndex; // El índice del ID en el array 'values'

        // Construir la query final
        const updateQuery = `
            UPDATE appointments SET ${setClauses.join(', ')}
            WHERE id = $${whereClauseIndex}
            RETURNING *
        `;

        // Ejecutar la consulta UPDATE
        const result = await db.query(updateQuery, values);

        // Debería devolver la fila actualizada
        if (result.rows.length === 0) {
             // Esto no debería pasar si la cita existía al principio, pero es una verificación segura.
             return res.status(404).json({ message: 'Cita no encontrada después de intentar actualizar (inesperado).' });
        }

        // Devolver la cita actualizada
        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(`Error en updateAppointment (ID: ${id}):`, err);
        // Manejar errores específicos como FK violation
        if (err.code === '23503') {
            return res.status(400).json({ message: `Error de referencia: ${err.detail || 'El ID de cliente o artista podría ser inválido.'}` });
        }
        if (err.message.includes("disponibilidad de horario")) {
            return res.status(500).json({ message: err.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar cita.' });
    }
};


// --- Obtener Todas las Citas ---
exports.getAllAppointments = async (req, res) => {
    try {
        // Query actualizada para incluir el nombre del artista haciendo JOIN
        const query = `
            SELECT
                a.*,                        -- Todos los campos de appointments
                c.name as client_name,      -- Nombre del cliente
                ar.name as artist_name      -- Nombre del artista
            FROM
                appointments a
            LEFT JOIN clients c ON a.client_id = c.id       -- Unir con clientes
            LEFT JOIN artists ar ON a.artist_id = ar.id    -- Unir con artistas
            ORDER BY
                a.appointment_time ASC      -- Ordenar por fecha/hora de la cita
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows); // Devolver las filas resultantes

    } catch (err) {
        // Manejo de errores
        console.error('Error al obtener citas:', err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener citas.' });
    }
};

// --- Obtener Cita por ID ---
exports.getAppointmentById = async (req, res) => {
    const { id } = req.params; // ID de la cita desde los parámetros de la URL
    try {
        // Query actualizada para incluir el nombre del cliente y el nombre del artista
        const query = `
            SELECT
                a.*,                       -- Todos los campos de appointments
                c.name as client_name,     -- Nombre del cliente
                ar.name as artist_name     -- Nombre del artista
            FROM
                appointments a
            LEFT JOIN clients c ON a.client_id = c.id      -- Unir con clientes
            LEFT JOIN artists ar ON a.artist_id = ar.id   -- Unir con artistas
            WHERE
                a.id = $1                  -- Filtrar por el ID proporcionado
        `;
        const result = await db.query(query, [id]); // Ejecutar la query con el ID

        // Verificar si se encontró la cita
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada.' });
        }
        // Devolver la cita encontrada
        res.status(200).json(result.rows[0]);

    } catch (err) {
        // Manejo de errores
        console.error(`Error al obtener cita por ID (${id}):`, err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener cita por ID.' });
    }
};

// --- Eliminar Cita ---
exports.deleteAppointment = async (req, res) => {
    const { id } = req.params; // ID de la cita a eliminar
    try {
        // Ejecutar DELETE y retornar la fila eliminada (si existe)
        const result = await db.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);

        // Verificar si se eliminó alguna fila
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada para eliminar.' });
        }
        // Confirmar eliminación exitosa
        res.status(200).json({ message: 'Cita eliminada exitosamente.' });

    } catch (err) {
        // Manejo de errores (ej. si la cita tiene dependencias que impiden borrarla, aunque no debería ser común aquí)
        console.error(`Error al eliminar cita (${id}):`, err.message, err.stack);

        res.status(500).json({ message: 'Error interno del servidor al eliminar cita.' });
    }
};