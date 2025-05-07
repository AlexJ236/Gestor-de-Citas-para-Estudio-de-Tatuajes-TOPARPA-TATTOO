import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Outlet, useNavigate, NavLink } from 'react-router-dom';
import {LogOut, LogIn, LayoutDashboard, Users, Calendar, Menu, X, CreditCard, FileText, Palette } from 'lucide-react';

function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Clases base para los NavLinks
  const linkClassBase = "flex items-center px-3 py-2 rounded transition-colors duration-150 ease-in-out text-sm";

  // Clases para enlaces de escritorio
  const linkClassDesktop = `${linkClassBase} text-text-secondary hover:bg-surface hover:text-primary`;
  const activeLinkClassDesktop = "bg-primary/10 text-primary font-semibold shadow-inner";

  // Clases para enlaces móviles
  const linkClassMobile = `flex items-center px-4 py-3 rounded-md transition-colors duration-150 ease-in-out text-text-primary hover:bg-primary hover:text-text-on-primary w-full text-base`;
  const activeLinkClassMobile = "bg-primary text-text-on-primary font-semibold shadow-md";


  return (
    <div className="min-h-screen bg-background text-text-primary">
      <nav className="bg-surface shadow-lg border-b border-border-color sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="text-xl font-bold text-text-primary hover:text-primary transition-colors flex-shrink-0">
                 TOPARPA TATTOO
             </Link>

            {/* Links Escritorio - Aplicando las clases base */}
            <div className="hidden md:flex items-center space-x-1">
               <NavLink to="/" end className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                  <LayoutDashboard size={18} className="mr-2" /> Dashboard {/* Ajustado mr-1.5 a mr-2 para consistencia */}
               </NavLink>
               <NavLink to="/clients" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                   <Users size={18} className="mr-2" /> Clientes
               </NavLink>
               <NavLink to="/appointments" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                   <Calendar size={18} className="mr-2" /> Citas
               </NavLink>
               <NavLink to="/expenses" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                   <CreditCard size={18} className="mr-2" /> Gastos
               </NavLink>
               {/* Enlace Artistas - Aplicando las mismas clases */}
               <NavLink to="/artists" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                    <Palette size={18} className="mr-2" /> Artistas
               </NavLink>
               <NavLink to="/reports" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                    <FileText size={18} className="mr-2" /> Reportes
               </NavLink>
            </div>

            {/* Botones Derecha (Login/Logout y Menú Hamburguesa) */}
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block">
                    {isAuthenticated ? (
                        <button onClick={handleLogout} className="btn-accent flex items-center text-xs px-3 py-1.5 rounded-md"> {/* Ajuste ligero de padding/rounded */}
                            <LogOut size={16} className="mr-1.5" /> Logout
                        </button>
                    ) : (
                        <Link to="/login" className={`${linkClassBase} text-text-secondary hover:text-primary px-3 py-1.5 text-xs`}> {/* Reusar clase base */}
                            <LogIn size={16} className="mr-1.5" /> Login
                        </Link>
                    )}
                </div>
                {/* Botón Menú Móvil */}
                <button
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 rounded text-text-secondary hover:text-primary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="sr-only">Abrir menú</span>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
          </div>
        </div>

        {/* Menú Móvil Desplegable - Aplicando las clases base */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-surface border-b-2 border-primary shadow-xl z-40" id="mobile-menu"> {/* z-index más alto y sombra más pronunciada */}
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink to="/" end onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}>
                  <LayoutDashboard size={20} className="mr-3" /> Dashboard
              </NavLink>

              <NavLink to="/clients" onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}>
                  <Users size={20} className="mr-3" /> Clientes
              </NavLink>

              <NavLink to="/appointments" onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}>
                  <Calendar size={20} className="mr-3" /> Citas
              </NavLink>

              <NavLink to="/expenses" onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}>
                  <CreditCard size={20} className="mr-3" /> Gastos
              </NavLink>
              {/* Enlace Artistas Móvil - Aplicando las mismas clases */}

              <NavLink to="/artists" onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}>
                  <Palette size={20} className="mr-3" /> Artistas
              </NavLink>

              <NavLink to="/reports" onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}>
                  <FileText size={20} className="mr-3" /> Reportes
              </NavLink>

              {/* Logout/Login en Móvil */}
              <div className="border-t border-border-color/50 pt-4 pb-2 mt-3">
                 {isAuthenticated ? (
                     <button
                        onClick={() => { handleLogout(); toggleMobileMenu(); }}
                        className="btn-accent flex items-center text-base px-4 py-2.5 w-full justify-center rounded-md" // Ajuste de padding/rounded
                     >
                         <LogOut size={20} className="mr-3" /> Logout
                     </button>
                 ) : (
                     <Link
                        to="/login"
                        onClick={toggleMobileMenu}
                        className={`${linkClassMobile} justify-center`}
                     >
                         <LogIn size={20} className="mr-3" /> Login
                     </Link>
                 )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 pb-8 pt-4 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;