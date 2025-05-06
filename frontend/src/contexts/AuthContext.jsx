import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(sessionStorage.getItem('authToken') || null);
  const isAuthenticated = !!token;

  useEffect(() => {
    const storedToken = sessionStorage.getItem('authToken');

    if (storedToken && token !== storedToken) {
       setToken(storedToken);
    }
  }, []);

  // Función para manejar el login
  const login = (newToken) => {
    sessionStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  // Función para manejar el logout
  const logout = () => {
    sessionStorage.removeItem('authToken');
    setToken(null);
  };

  // Valores que serán compartidos por el contexto
  const value = {
    token,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}