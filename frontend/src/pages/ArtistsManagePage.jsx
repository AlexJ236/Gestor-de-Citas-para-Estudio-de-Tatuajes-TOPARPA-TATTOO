import React, { useState, useEffect, useCallback } from 'react';
import { getAllArtists, createArtist, updateArtist, deleteArtist } from '../services/artistService';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import { PlusCircle, Edit, Trash2, Save, XCircle, AlertCircle } from 'lucide-react';
import 'react-confirm-alert/src/react-confirm-alert.css';

function ArtistsManagePage() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newArtistName, setNewArtistName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingArtist, setEditingArtist] = useState(null);
    const [editName, setEditName] = useState('');

    // Cargar artistas
    const fetchArtists = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await getAllArtists();
            setArtists(Array.isArray(data) ? data : []);
        } catch (err) {
            setError("Error al cargar los artistas.");
            setArtists([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArtists();
    }, [fetchArtists]);

    // Manejar adición
    const handleAddArtist = async (e) => {
        e.preventDefault();
        if (!newArtistName.trim()) {
            toast.warn('El nombre del artista no puede estar vacío.');
            return;
        }
        setIsAdding(true);
        try {
            const newArtist = await createArtist({ name: newArtistName.trim() });
            setArtists(prev => [...prev, newArtist].sort((a, b) => a.name.localeCompare(b.name))); // Añadir y ordenar
            setNewArtistName(''); // Limpiar input
            toast.success(`Artista "${newArtist.name}" creado.`);
        } catch (err) { /* Servicio maneja toast */ }
        finally { setIsAdding(false); }
    };

    // Manejar inicio de edición
    const handleEditClick = (artist) => {
        setEditingArtist(artist);
        setEditName(artist.name); // Pre-rellenar input de edición
    };

    // Manejar cancelación de edición
    const handleCancelEdit = () => {
        setEditingArtist(null);
        setEditName('');
    };

    // Manejar guardado de edición
    const handleSaveEdit = async () => {
        if (!editingArtist || !editName.trim() || editName.trim() === editingArtist.name) {
            handleCancelEdit(); // Cancela si no hay cambios o está vacío
            return;
        }
        // Podríamos añadir isSaving para el botón de guardar específico
        try {
            const updated = await updateArtist(editingArtist.id, { name: editName.trim() });
            setArtists(prev => prev.map(a => a.id === updated.id ? updated : a)
                                 .sort((a, b) => a.name.localeCompare(b.name))); // Actualizar y reordenar
            toast.success(`Artista "<span class="math-inline">\{editingArtist\.name\}" renombrado a "</span>{updated.name}".`);
            handleCancelEdit();
        } catch (err) { /* Servicio maneja toast */ }
    };

    // Manejar eliminación
    const handleDeleteArtist = (artist) => {
        confirmAlert({
            title: 'Confirmar Eliminación',
            message: `¿Estás seguro de eliminar al artista "${artist.name}"? Las citas asociadas quedarán sin artista asignado.`,
            buttons: [
                { label: 'Sí, Eliminar',
                  onClick: async () => {
                      try {
                          await deleteArtist(artist.id);
                          setArtists(prev => prev.filter(a => a.id !== artist.id));
                          toast.success(`Artista "${artist.name}" eliminado.`);
                      } catch (err) { /* Servicio maneja toast */ }
                  }
                },
                { label: 'No, Cancelar' }
            ],
            overlayClassName: "react-confirm-alert-overlay-dark"
        });
    };

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Gestionar Artistas</h1>

            {/* Formulario para añadir nuevo artista */}
            <form onSubmit={handleAddArtist} className="mb-8 bg-surface p-4 rounded-lg shadow border border-border-color flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-grow">
                    <label htmlFor="newArtistName" className="block text-sm font-medium text-text-secondary mb-1">
                        Nombre del Nuevo Artista:
                    </label>
                    <input
                        type="text"
                        id="newArtistName"
                        value={newArtistName}
                        onChange={(e) => setNewArtistName(e.target.value)}
                        placeholder="Ej: Miguel Ángel"
                        className="w-full"
                        disabled={isAdding}
                        required
                    />
                </div>
                <button type="submit" className="btn-primary flex items-center gap-1 w-full sm:w-auto justify-center" disabled={isAdding}>
                    <PlusCircle size={18} /> {isAdding ? 'Añadiendo...' : 'Añadir Artista'}
                </button>
            </form>

            {/* Lista de Artistas */}
            <h2 className="text-xl font-semibold mb-4">Artistas Actuales</h2>
            {loading && <p className="text-text-secondary text-center py-5">Cargando artistas...</p>}
            {error && !loading && (
                <div className="bg-red-900/30 border border-accent text-red-300 px-4 py-3 rounded relative mb-6 flex items-center" role="alert">
                    <AlertCircle size={20} className="mr-2"/> <span>{error} Intenta recargar la página.</span>
                </div>
            )}
            {!loading && !error && artists.length === 0 && (
                <p className="text-center text-text-secondary py-10 bg-surface rounded-lg border border-border-color">No hay artistas registrados.</p>
            )}
            {!loading && !error && artists.length > 0 && (
                <ul className="space-y-3">
                    {artists.map((artist) => (
                        <li key={artist.id} className="bg-surface p-3 rounded-lg shadow border border-border-color flex items-center justify-between gap-3">
                            {editingArtist?.id === artist.id ? (
                                // Modo Edición
                                <div className="flex-grow flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-grow px-2 py-1 border border-primary rounded"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                    />
                                    <button onClick={handleSaveEdit} className="btn-primary p-1.5" title="Guardar"> <Save size={16}/> </button>
                                    <button onClick={handleCancelEdit} className="btn-secondary p-1.5" title="Cancelar"> <XCircle size={16}/> </button>
                                </div>
                            ) : (
                                // Modo Visualización
                                <>
                                    <span className="text-text-primary flex-grow truncate">{artist.name}</span>
                                    <div className="flex items-center space-x-2 shrink-0">
                                        <button onClick={() => handleEditClick(artist)} className="text-primary hover:text-primary-variant p-1" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteArtist(artist)} className="text-accent hover:text-accent-hover p-1" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ArtistsManagePage;