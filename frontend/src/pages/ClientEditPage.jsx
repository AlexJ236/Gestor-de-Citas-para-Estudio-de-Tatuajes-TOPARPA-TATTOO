import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientById, updateClient } from '../services/clientService';
import { toast } from 'react-toastify';
import ClientForm from '../components/ClientForm';

function ClientEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadClientData = async () => {
      setLoading(true);
      try {
        const client = await getClientById(id);
        setClientData(client);
      } catch (err) {
        const errorMessage = err.response?.status === 404
          ? 'Cliente no encontrado.'
          : 'Error al cargar datos del cliente.';
        toast.error(errorMessage);
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };
    loadClientData();
  }, [id, navigate]);

  const handleUpdateClient = async (updatedData) => {
    setIsSaving(true);
    try {
      await updateClient(id, updatedData);
      toast.success('Cliente actualizado exitosamente!');
      navigate('/clients');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al guardar los cambios.';
      if (err.response?.status === 409) {
        toast.error('Error: El email ya está registrado para otro cliente.');
      } else if (err.response?.status === 404) {
        toast.error('Error: No se encontró el cliente para actualizar.');
      } else {
        toast.error(errorMessage);
      }
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p>Cargando datos del cliente...</p>;
  }

  if (!clientData) {
    return <p>No se pudieron cargar los datos del cliente.</p>;
  }

  return (
    <div>
      <h1>Editar Cliente</h1>
      <ClientForm
        initialData={clientData}
        onSubmit={handleUpdateClient}
        isSaving={isSaving}
        submitButtonText="Guardar Cambios"
        onCancel={() => navigate('/clients')}
      />
    </div>
  );
}

export default ClientEditPage;