import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllClients, deleteClient } from '../services/clientService';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

function ClientsListPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    try { const data = await getAllClients(); setClients(Array.isArray(data) ? data : []); }
    catch (err) { const msg = err.response?.data?.message || 'Error cargando clientes.'; if (err.response?.status === 401 || err.response?.status === 403) toast.error('Acceso denegado.'); else toast.error(msg); console.error(err); setClients([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleDelete = async (clientId, clientName) => {
    confirmAlert({
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de eliminar a "${clientName}"? Se borrarán también sus citas. Esta acción no se puede deshacer.`,
        buttons: [
            { label: 'Sí, Eliminar',
              onClick: async () => {
                try {
                    await deleteClient(clientId);
                    setClients(prevClients => prevClients.filter(client => client.id !== clientId));
                    toast.success('Cliente eliminado exitosamente');
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'Error al eliminar.';
                    if (err.response?.status === 404) { toast.error('Cliente no encontrado.'); }
                    else { toast.error(errorMessage); }
                    console.error(err);
                }
              }
            },
            { label: 'No, Cancelar', onClick: () => {} }
        ],
        overlayClassName: "react-confirm-alert-overlay-dark" // Clase opcional para overlay oscuro
    });
  };

  if (loading) { return <p className="text-text-secondary p-10 text-center">Cargando clientes...</p>; }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Lista de Clientes</h1> {/* Ajustar tamaño título */}
        <Link to="/clients/new" className="self-start sm:self-center"> {/* Alinear botón */}
           <button className="btn-primary w-full sm:w-auto"> {/* Clase botón primario */}
               Añadir Nuevo Cliente
           </button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-center text-text-secondary py-10 bg-surface rounded-lg border border-border-color">No hay clientes registrados.</p>
      ) : (
        <ul className="space-y-4">
          {clients.map((client) => (
            <li key={client.id} className="bg-surface p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col sm:flex-row justify-between sm:items-start border border-border-color gap-3"> {/* Alinear items arriba en sm+ */}
              {/* Info Cliente */}
              <div className="flex-grow min-w-0"> {/* Evitar que texto largo empuje botones */}
                <strong className="text-base sm:text-lg text-text-primary block truncate">{client.name}</strong> {/* Truncar nombre largo */}
                <span className="text-sm text-text-secondary block truncate">Email: {client.email || 'N/A'}</span> {/* Truncar email */}
                <span className="text-sm text-text-secondary block">Teléfono: {client.phone || 'N/A'}</span>
                {client.notes && (
                   <p className="text-xs text-text-secondary mt-2 pt-2 border-t border-border-color/50 whitespace-pre-wrap">
                      Notas: {client.notes}
                   </p>
                )}
              </div>
              {/* Botones Acción */}
              <div className="flex space-x-2 justify-end shrink-0 self-end sm:self-center pt-2 sm:pt-0"> {/* Alinear botones */}
                 <Link to={`/clients/edit/${client.id}`}>
                   <button className="btn-secondary text-xs px-3 py-1"> Editar </button> {/* Botón secundario */}
                 </Link>
                 <button
                    onClick={() => handleDelete(client.id, client.name)}
                    className="btn-accent text-xs px-3 py-1" /* Botón accent */
                   >
                   Eliminar
                 </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ClientsListPage;