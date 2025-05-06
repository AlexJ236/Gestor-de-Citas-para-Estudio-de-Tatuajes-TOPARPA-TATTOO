import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Importa nuestro hook

function ProtectedRoute() {
  const { isAuthenticated } = useAuth(); // Obtiene el estado de autenticación del contexto

  if (!isAuthenticated) {
    // Si no está autenticado, redirige a la página de login
    // 'replace' evita que la ruta protegida quede en el historial del navegador
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderiza el componente hijo de la ruta (usando Outlet)
  return <Outlet />;
}

export default ProtectedRoute;