import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppointmentById, updateAppointment } from '../services/appointmentService';
import { getAllClients } from '../services/clientService';
import { toast } from 'react-toastify';
import AppointmentForm from '../components/AppointmentForm';

function AppointmentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointmentData, setAppointmentData] = useState(null); // Datos de la cita a editar
  const [clients, setClients] = useState([]); // Lista de clientes
  const [loading, setLoading] = useState(true); // Carga inicial combinada
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos de la cita Y lista de clientes
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Cargar ambas cosas en paralelo
        const [fetchedAppointmentData, fetchedClientData] = await Promise.all([
          getAppointmentById(id),
          getAllClients()
        ]);
        setAppointmentData(fetchedAppointmentData); // Guardar datos de la cita
        setClients(fetchedClientData);             // Guardar lista de clientes
      } catch (err) {
        const errorMessage = err.response?.status === 404
          ? 'Cita o cliente no encontrado.'
          : 'Error al cargar los datos para editar.';
        toast.error(errorMessage);
        navigate('/appointments'); // Redirigir si falla la carga
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [id, navigate]); // Añadir navigate a dependencias

  // Manejador que recibe datos del AppointmentForm
  const handleUpdateAppointment = async (updatedData) => {
     // Validación básica
     if (!updatedData.client_id || !updatedData.appointment_time) {
        toast.error('Por favor, selecciona un cliente y una fecha/hora.');
        return;
    }
    setIsSaving(true);
    try {
      await updateAppointment(id, updatedData);
      toast.success('Cita actualizada exitosamente!');
      navigate('/appointments');
    } catch (err) {
       const errorMessage = err.response?.data?.message || 'Error al guardar cambios.';
       toast.error(errorMessage);
       setIsSaving(false); // Solo en error
    }
  };

  if (loading) {
    return <p>Cargando datos de la cita...</p>;
  }

  if (!appointmentData) {
     // Ya se mostró toast y se intentó redirigir
    return <p>No se pudieron cargar los datos de la cita.</p>;
  }

  return (
    <div>
      <h1>Editar Cita</h1>
      {/* Renderizar el formulario reutilizable */}
      <AppointmentForm
        initialData={appointmentData} // Pasar datos iniciales de la cita
        onSubmit={handleUpdateAppointment}
        isSaving={isSaving}
        submitButtonText="Guardar Cambios"
        onCancel={() => navigate('/appointments')}
        clients={clients} // Pasar lista de clientes
        isLoadingClients={loading} // Usar el estado de carga general aquí
      />
    </div>
  );
}

export default AppointmentEditPage;