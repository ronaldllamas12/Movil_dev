import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useCarrito } from '../context/CarritoContext';

export default function Login() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useCarrito();
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
    navigate('/');
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] text-[color:var(--text)] px-4 py-10 flex items-start justify-center">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="inline-flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-purple-600 w-16 h-16 text-white font-bold text-xl shadow-xl">
            MD
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Móvil Dev</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)] max-w-xl mx-auto">
              Inicia sesión para seguir con tu compra y acceder a tus pedidos, descuentos y favoritos.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl overflow-hidden">
          <div className="flex bg-[color:var(--surface-muted)] p-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition ${activeTab === 'login' ? 'bg-white text-[color:var(--text)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition ${activeTab === 'register' ? 'bg-white text-[color:var(--text)] shadow-sm' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'}`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-8 md:p-10">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[color:var(--text)]">Iniciar Sesión</h2>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">Ingresa tus credenciales para acceder a tu cuenta</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-[color:var(--text)]">
                    Email
                    <div className="mt-2 relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                        required
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-medium text-[color:var(--text)]">
                    Contraseña
                    <div className="mt-2 relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-12 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={() => setRemember((prev) => !prev)}
                      className="h-4 w-4 rounded border-[color:var(--border)] bg-[color:var(--surface)] text-purple-600 focus:ring-purple-500"
                    />
                    Recordarme
                  </label>
                  <button type="button" className="text-purple-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Iniciar Sesión
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[color:var(--text)]">Crear Cuenta</h2>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">Regístrate para comenzar a comprar celulares y guardar tus favoritos.</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-[color:var(--text)]">
                    Nombre
                    <div className="mt-2 relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                        required
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-medium text-[color:var(--text)]">
                    Email
                    <div className="mt-2 relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                        required
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-medium text-[color:var(--text)]">
                    Contraseña
                    <div className="mt-2 relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-12 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </label>

                  <label className="block text-sm font-medium text-[color:var(--text)]">
                    Confirmar contraseña
                    <div className="mt-2 relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="********"
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-12 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Crear cuenta
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
