const db = require('../config/db');

// Obtener todos los artistas
exports.getAllArtists = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name FROM artists ORDER BY name ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener artistas:', err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener artistas.' });
    }
};

// Crear un nuevo artista
exports.createArtist = async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'El nombre del artista es obligatorio.' });
    }
    try {
        const result = await db.query(
            'INSERT INTO artists (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, name',
            [name.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Manejar error si el nombre ya existe (UNIQUE constraint)
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ message: `El artista "${name.trim()}" ya existe.` });
        }
        console.error('Error al crear artista:', err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear artista.' });
    }
};

// Obtener un artista por ID
exports.getArtistById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT id, name FROM artists WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Artista no encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`Error al obtener artista por ID (${id}):`, err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Actualizar un artista
exports.updateArtist = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'El nombre del artista es obligatorio.' });
    }

    try {
        const result = await db.query(
            'UPDATE artists SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name',
            [name.trim(), id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Artista no encontrado para actualizar.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ message: `El nombre "${name.trim()}" ya está en uso por otro artista.` });
        }
        console.error(`Error al actualizar artista (${id}):`, err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al actualizar artista.' });
    }
};

// Eliminar un artista
exports.deleteArtist = async (req, res) => {
    const { id } = req.params;
    try {

        const result = await db.query('DELETE FROM artists WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Artista no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Artista eliminado exitosamente.' });
    } catch (err) {
        // Manejar error si, por ejemplo, la FK en appointments fuera RESTRICT
         if (err.code === '23503') { // foreign_key_violation
            return res.status(409).json({ message: 'No se puede eliminar el artista porque tiene citas asociadas. Reasigna o elimina las citas primero.' });
         }
        console.error(`Error al eliminar artista (${id}):`, err.message, err.stack);
        res.status(500).json({ message: 'Error interno del servidor al eliminar artista.' });
    }
};