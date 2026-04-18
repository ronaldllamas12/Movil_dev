import { LogOut, Menu, Moon, Search, ShoppingCart, Sun, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { carrito, isLoggedIn, logout, currentUser } = useCarrito(); 
  const { theme, toggleTheme } = useTheme();
  const isAdmin = currentUser?.role === 'administrador';
  
  // Calculamos el total de productos para el badge
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <nav className="w-full bg-[color:var(--surface)] border-b border-[color:var(--border)] sticky top-0 z-50">
      {/* Barra superior */}
      <div className="w-full bg-[color:var(--surface-muted)] text-[color:var(--muted)] text-xs py-2 px-4 md:px-10 flex justify-between items-center border-b border-[color:var(--border)]">
        <span>+54 11 1234-5678 | info@movildev.com</span>
        <span className="hidden sm:inline">Envío gratis en compras superiores a $800.000</span>
      </div>

      {/* Contenedor Principal */}
      <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between gap-8 bg-[color:var(--surface)] border-b border-[color:var(--border)]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg text-white font-bold text-xl">
            MD
          </div>
          <span className="font-bold text-2xl text-[color:var(--text)]">Móvil Dev</span>
        </Link>

        {/* Links de Navegación Completos */}
        <div className="hidden lg:flex items-center gap-6 font-medium">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `transition ${isActive ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-600 hover:text-purple-600"}`
            }
          >
            Inicio
          </NavLink>
          
          <NavLink 
            to="/catalogo" 
            end
            className={({ isActive }) => 
              `transition ${isActive ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-600 hover:text-purple-600"}`
            }
          >
            Catálogo
          </NavLink>
          
          <NavLink 
            to="/catalogo/premium" 
            className={({ isActive }) => 
              `transition ${isActive ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-600 hover:text-purple-600"}`
            }
          >
            Premium
          </NavLink>

          <NavLink 
            to="/catalogo/gama-media" 
            className={({ isActive }) => 
              `transition ${isActive ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-600 hover:text-purple-600"}`
            }
          >
            Gama Media
          </NavLink>

          <NavLink 
            to="/catalogo/economicos" 
            className={({ isActive }) => 
              `transition ${isActive ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-600 hover:text-purple-600"}`
            }
          >
            Económicos
          </NavLink>

          {isLoggedIn && isAdmin && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `transition ${isActive ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-600 hover:text-purple-600'}`
              }
            >
              Dashboard
            </NavLink>
          )}
        </div>

        {/* Buscador */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <input 
            type="text" 
            placeholder="Buscar celulares..." 
            className="w-full bg-[color:var(--surface-muted)] border border-[color:var(--border)] rounded-full py-2 px-5 pl-12 focus:ring-2 focus:ring-purple-500 outline-none text-[color:var(--text)]"
          />
          <Search className="absolute left-4 top-2.5 text-[color:var(--muted)] size-5" />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menú"
            className="lg:hidden flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-[color:var(--text)] shadow-sm transition hover:bg-[color:var(--surface-muted)]"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="hidden sm:flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-[color:var(--text)] shadow-sm transition hover:bg-[color:var(--surface-muted)]"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Carrito con redirección inteligente */}
          <Link 
            to="/carrito" 
            className="relative text-[color:var(--text)] hover:text-purple-600 transition"
          >
            <ShoppingCart className="size-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] rounded-full size-5 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Botón de Usuario */}
          <Link
            to={isLoggedIn ? '/perfil' : '/login'}
            className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] px-5 py-2 font-medium transition hover:bg-[color:var(--surface-muted)]"
            aria-label={isLoggedIn ? 'Ver perfil' : 'Iniciar sesión'}
          >
            <User className="size-5" />
            <span className="hidden md:inline">{isLoggedIn ? 'Mi Perfil' : 'Ingresar'}</span>
          </Link>

          {isLoggedIn && (
            <button
              type="button"
              onClick={logout}
              className="hidden sm:flex items-center gap-2 rounded-full border border-red-200 bg-red-50 text-red-700 px-4 py-2 font-medium transition hover:bg-red-100"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
              <span className="hidden md:inline">Salir</span>
            </button>
          )}
        </div>
      </div>

      <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'} border-t border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-4`}> 
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)] size-5" />
            <input 
              type="text"
              placeholder="Buscar celulares..."
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none focus:border-purple-600"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 transition ${isActive ? 'bg-purple-600 text-white' : 'text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]'}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/catalogo"
            end
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 transition ${isActive ? 'bg-purple-600 text-white' : 'text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]'}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            Catálogo
          </NavLink>
          <NavLink
            to="/catalogo/premium"
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 transition ${isActive ? 'bg-purple-600 text-white' : 'text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]'}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            Premium
          </NavLink>
          <NavLink
            to="/catalogo/gama-media"
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 transition ${isActive ? 'bg-purple-600 text-white' : 'text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]'}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            Gama Media
          </NavLink>
          <NavLink
            to="/catalogo/economicos"
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 transition ${isActive ? 'bg-purple-600 text-white' : 'text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]'}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            Económicos
          </NavLink>
          {isLoggedIn && isAdmin && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 transition ${isActive ? 'bg-purple-600 text-white' : 'text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]'}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}