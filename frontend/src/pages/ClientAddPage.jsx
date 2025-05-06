import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../services/clientService';
import { toast } from 'react-toastify';
import ClientForm from '../components/ClientForm';

function ClientAddPage() {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // La lógica de submit ahora recibe los datos del ClientForm
  const handleCreateClient = async (clientData) => {
    setIsSaving(true);
    try {
      await createClient(clientData);
      toast.success('Cliente creado exitosamente!');
      navigate('/clients');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al crear el cliente.';
      if (err.response?.status === 409) {
        toast.error('Error: El email ya está registrado.');
      } else {
        toast.error(errorMessage);
      }
      setIsSaving(false); // Solo si hay error
    }
    // No setIsSaving(false) en éxito por navegación
  };

  return (
    <div>
      <h1>Añadir Nuevo Cliente</h1>
      <ClientForm
        onSubmit={handleCreateClient} // Pasa la función de creación
        isSaving={isSaving}
        submitButtonText="Guardar Cliente"
        onCancel={() => navigate('/clients')} // Función para cancelar
      />
    </div>
  );
}

export default ClientAddPage;