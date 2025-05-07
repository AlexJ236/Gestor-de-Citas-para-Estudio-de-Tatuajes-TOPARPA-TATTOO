import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Outlet, useNavigate, NavLink } from 'react-router-dom';
import { LogOut, LogIn, LayoutDashboard, Users, Calendar, Menu, X, CreditCard, FileText, Palette } from 'lucide-react';

function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const linkClassBase = "flex items-center px-3 py-2 rounded transition-colors";
  const linkClassDesktop = `${linkClassBase} hover:bg-white/10 text-text-secondary`;
  const activeLinkClassDesktop = "bg-white/10 text-text-primary font-semibold";
  const linkClassMobile = `${linkClassBase} text-text-primary hover:bg-primary hover:text-text-on-primary w-full text-lg py-3`;
  const activeLinkClassMobile = "bg-primary text-text-on-primary font-semibold";

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <nav className="bg-surface shadow-lg border-b border-border-color sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-text-primary hover:text-primary transition-colors flex-shrink-0">
                 TOPARPA TATTOO
             </Link>

            {/* Links Escritorio */}
            <div className="hidden md:flex items-center space-x-1">
               <NavLink to="/" end className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                  <LayoutDashboard size={18} className="mr-1.5" /> Dashboard
               </NavLink>

               <NavLink to="/clients" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                   <Users size={18} className="mr-1.5" /> Clientes
               </NavLink>

               <NavLink to="/appointments" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                   <Calendar size={18} className="mr-1.5" /> Citas
               </NavLink>

               <NavLink to="/expenses" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                   <CreditCard size={18} className="mr-1.5" /> Gastos
               </NavLink>

               <NavLink to="/artists" onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}>
                  <Palette size={20} className="mr-3" /> Artistas
              </NavLink>

               <NavLink to="/reports" className={({ isActive }) => `${linkClassDesktop} ${isActive ? activeLinkClassDesktop : ''}`}>
                    <FileText size={18} className="mr-1.5" /> Reportes
               </NavLink>
            </div>

            {/* Botones Derecha */}
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block"> {/* Login/Logout Desktop */}
                    {isAuthenticated ? ( <button onClick={handleLogout} className="btn-accent flex items-center text-sm px-3 py-1"> <LogOut size={16} className="mr-1" /> Logout </button>
                    ) : ( <Link to="/login" className="flex items-center text-text-secondary hover:text-primary transition-colors text-sm"> <LogIn size={16} className="mr-1" /> Login </Link> )}
                </div>
                <button onClick={toggleMobileMenu} className="md:hidden p-2 rounded text-text-secondary hover:text-primary hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen}>
                    <span className="sr-only">Abrir menú</span> {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-surface border-b border-border-color shadow-lg" id="mobile-menu">
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

              <NavLink to="/reports" onClick={toggleMobileMenu} className={({ isActive }) => `${linkClassMobile} ${isActive ? activeLinkClassMobile : ''}`}> 
              <FileText size={20} className="mr-3" /> Reportes 
              </NavLink>
              
              <div className="border-t border-border-color pt-4 pb-2 mt-3">
                 {isAuthenticated ? ( <button onClick={() => { handleLogout(); toggleMobileMenu(); }} className="btn-accent flex items-center text-base px-3 py-2 w-full justify-center"> <LogOut size={20} className="mr-3" /> Logout </button>
                 ) : ( <Link to="/login" onClick={toggleMobileMenu} className={`${linkClassMobile} justify-center`}> <LogIn size={20} className="mr-3" /> Login </Link> )}
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