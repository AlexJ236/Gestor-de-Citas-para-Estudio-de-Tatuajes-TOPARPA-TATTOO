import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

function ClientForm({ initialData = {}, onSubmit, isSaving = false, submitButtonText = 'Guardar', onCancel }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setName(initialData.name || '');
    setPhone(initialData.phone || '');
    setEmail(initialData.email || '');
    setNotes(initialData.notes || '');
  }, [initialData?.id]); // Depender de ID para resetear en edit si cambia

  const handleNameChange = (e) => setName(e.target.value);
  const handlePhoneChange = (e) => setPhone(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleNotesChange = (e) => setNotes(e.target.value);

  const handleInternalSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) { toast.error('El nombre es obligatorio.'); return; }
    const clientData = { name, phone, email, notes };
    onSubmit(clientData);
  };

  return (
    // Ocupa ancho completo por defecto, máx ancho en sm+
    <form onSubmit={handleInternalSubmit} className="w-full sm:max-w-lg sm:mx-auto bg-surface p-4 sm:p-6 rounded-lg shadow-lg space-y-4 border border-border-color">
      {/* Campo Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Nombre:</label>
        <input
          type="text" id="name" value={name} onChange={handleNameChange} required
          className="w-full" disabled={isSaving}
        />
      </div>
      {/* Campo Teléfono */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Teléfono:</label>
        <input
          type="tel" id="phone" value={phone} onChange={handlePhoneChange}
          className="w-full" disabled={isSaving}
        />
      </div>
      {/* Campo Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email:</label>
        <input
          type="email" id="email" value={email} onChange={handleEmailChange}
           className="w-full" disabled={isSaving}
        />
      </div>
      {/* Campo Notas */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">Notas:</label>
        <textarea
          id="notes" value={notes} onChange={handleNotesChange} rows="3"
          className="w-full" disabled={isSaving}
        />
      </div>
      {/* Botones */}
       <div className="flex justify-end space-x-3 pt-3">
            {onCancel && ( <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary"> Cancelar </button> )}
            <button type="submit" disabled={isSaving} className="btn-primary"> {isSaving ? 'Guardando...' : submitButtonText} </button>
       </div>
    </form>
  );
}

// PropTypes
ClientForm.propTypes = {
  initialData: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), name: PropTypes.string, phone: PropTypes.string, email: PropTypes.string, notes: PropTypes.string }),
  onSubmit: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  submitButtonText: PropTypes.string,
  onCancel: PropTypes.func,
};

export default ClientForm;