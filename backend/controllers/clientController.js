const db = require('../config/db');

// Obtener todos los clientes
exports.getAllClients = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clients ORDER BY name ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener clientes:', err.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Obtener un cliente por ID
exports.getClientById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener cliente por ID:', err.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Crear un nuevo cliente
exports.createClient = async (req, res) => {
    const { name, phone, email, notes } = req.body;

    if (!name) { // Validación simple
        return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });
    }

    try {
        const result = await db.query(
            'INSERT INTO clients (name, phone, email, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone, email, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Manejo de error para email duplicado (unique constraint)
        if (err.code === '23505' && err.constraint === 'clients_email_key') {
             return res.status(409).json({ message: 'El email proporcionado ya está registrado' });
        }
        console.error('Error al crear cliente:', err.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Actualizar un cliente existente
exports.updateClient = async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, notes } = req.body;

     if (!name) { // Validación simple
        return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });
    }

    try {
        // Primero, verifica si el cliente existe
        const checkExist = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (checkExist.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Ejecuta la actualización
        const result = await db.query(
            'UPDATE clients SET name = $1, phone = $2, email = $3, notes = $4 WHERE id = $5 RETURNING *',
            [name, phone, email, notes, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
         // Manejo de error para email duplicado (unique constraint) al actualizar
         if (err.code === '23505' && err.constraint === 'clients_email_key') {
            return res.status(409).json({ message: 'El email proporcionado ya está registrado para otro cliente' });
       }
        console.error('Error al actualizar cliente:', err.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Eliminar un cliente
exports.deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        // Intentar eliminar y devolver la fila eliminada
        const result = await db.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            // Si no se eliminó nada, el cliente no existía
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json({ message: 'Cliente eliminado exitosamente (y sus citas asociadas si aplica)' });

    } catch (err) {
        console.error('Error al eliminar cliente:', err.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};