import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsListPage from './pages/ClientsListPage';
import ClientAddPage from './pages/ClientAddPage';
import ClientEditPage from './pages/ClientEditPage';
import AppointmentsListPage from './pages/AppointmentsListPage';
import AppointmentAddPage from './pages/AppointmentAddPage';
import AppointmentEditPage from './pages/AppointmentEditPage';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseAddPage from './pages/ExpenseAddPage';
import ExpenseEditPage from './pages/ExpenseEditPage';
import ReportsPage from './pages/ReportsPage';
import ArtistsManagePage from './pages/ArtistsManagePage';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer /* ... props ... */ />
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            {/* Clientes */}
            <Route path="clients" element={<ClientsListPage />} />
            <Route path="clients/new" element={<ClientAddPage />} />
            <Route path="clients/edit/:id" element={<ClientEditPage />} />
            {/* Citas */}
            <Route path="appointments" element={<AppointmentsListPage />} />
            <Route path="appointments/new" element={<AppointmentAddPage />} />
            <Route path="appointments/edit/:id" element={<AppointmentEditPage />} />
            {/* Gastos */}
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="expenses/new" element={<ExpenseAddPage />} />
            <Route path="expenses/edit/:id" element={<ExpenseEditPage />} />
            {/* Reportes */}
            <Route path="reports" element={<ReportsPage />} />
            {/* Artistas */}
            <Route path="artists" element={<ArtistsManagePage />} />
          </Route>
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<div>404 - Página No Encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;