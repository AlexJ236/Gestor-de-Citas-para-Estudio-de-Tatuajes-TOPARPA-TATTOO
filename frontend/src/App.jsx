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

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
          position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false}
          closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover
          theme="dark"
      />
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />
            {/* Clientes */}
            <Route path="clients" element={<ClientsListPage />} />
            <Route path="clients/new" element={<ClientAddPage />} />
            <Route path="clients/edit/:id" element={<ClientEditPage />} />
            {/* Citas */}
            <Route path="appointments" element={<AppointmentsListPage />} />
            <Route path="appointments/new" element={<AppointmentAddPage />} />
            <Route path="appointments/edit/:id" element={<AppointmentEditPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="expenses/new" element={<ExpenseAddPage />} />
            <Route path="expenses/edit/:id" element={<ExpenseEditPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<div className='text-center py-10'><h1 className='text-4xl text-accent'>404</h1><p className='text-text-secondary'>Página No Encontrada</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;