import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAppointment } from '../services/appointmentService';
import { getAllClients } from '../services/clientService';
import { toast } from 'react-toastify';
import AppointmentForm from '../components/AppointmentForm';

function AppointmentAddPage() {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true); // Comienza cargando
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Cargar clientes
  useEffect(() => {
    let isMounted = true;
    const fetchClients = async () => {
      setLoadingClients(true); // Asegurar que esté true al inicio
      try {
        const clientData = await getAllClients();
        if (isMounted) {
          setClients(clientData);
          // console.log("Clients loaded, setting isLoadingClients to false");
        }
      } catch (err) {
        console.error("Error cargando clientes:", err);
        if(isMounted) {
            toast.error('No se pudieron cargar los clientes.');
        }
      } finally {
        // Este bloque SIEMPRE se ejecuta, poner isLoadingClients en false aquí
        if(isMounted) {
            setLoadingClients(false);
        }
      }
    };
    fetchClients();
    return () => { isMounted = false; }
  }, []); // Solo al montar

  const handleCreateAppointment = useCallback(async (appointmentData) => {
    setIsSaving(true);
    try {
      await createAppointment(appointmentData);
      toast.success('Cita agendada exitosamente!');
      navigate('/appointments');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al agendar la cita.';
      if (err.response?.status === 400 && err.response?.data?.message.includes('cliente')) {
          toast.error('Error: El cliente seleccionado no es válido.');
      } else {
        toast.error(errorMessage);
      }
      setIsSaving(false);
    }
  }, [navigate]);

  // Usar useMemo para initialData asegura una referencia estable
  const initialAppointmentData = useMemo(() => ({}), []);

  return (
    <div>
      <h1>Agendar Nueva Cita</h1>
      <AppointmentForm
        initialData={initialAppointmentData} // Objeto vacío estable
        onSubmit={handleCreateAppointment}
        isSaving={isSaving}
        submitButtonText="Agendar Cita"
        onCancel={() => navigate('/appointments')}
        clients={clients}
        isLoadingClients={loadingClients} // Pasar el estado de carga
      />
    </div>
  );
}

export default AppointmentAddPage;