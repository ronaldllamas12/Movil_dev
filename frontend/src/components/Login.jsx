import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/axiosClient';
import {
    forgotPassword,
    loginUser,
    loginWithGoogle,
    registerUser,
    resetPassword,
} from '../api/services/authService';
import { useCarrito } from '../context/CarritoContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function getPostLoginPath(user) {
  return user?.role === 'administrador' ? '/dashboard' : '/';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCarrito();
  const [authView, setAuthView] = useState('tabs');
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [googleScriptError, setGoogleScriptError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const googleButtonRef = useRef(null);
  const googleButtonRegisterRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const isGoogleEnabled = Boolean(GOOGLE_CLIENT_ID);

  const handleGoogleCredential = async (response) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const data = await loginWithGoogle(response.credential);
      login(data.user);
      navigate(getPostLoginPath(data.user));
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromLink = params.get('token');

    if (!tokenFromLink) {
      return;
    }

    setResetToken(tokenFromLink);
    setAuthView('reset');
    setErrorMsg('');
    setForgotSuccessMsg('');
    setResetSuccessMsg('');
    navigate('/login', { replace: true });
  }, [location.search, navigate]);

  const renderGoogleButtons = () => {
    if (!window.google?.accounts?.id) return;
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 360,
      });
    }
    if (googleButtonRegisterRef.current) {
      window.google.accounts.id.renderButton(googleButtonRegisterRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signup_with',
        width: 360,
      });
    }
  };

  useEffect(() => {
    const initializeGoogleButton = () => {
      if (!window.google?.accounts?.id || googleInitializedRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        button_auto_select: false,
        use_fedcm_for_button: false,
        use_fedcm_for_prompt: false,
      });

      renderGoogleButtons();
      googleInitializedRef.current = true;
    };

    if (!isGoogleEnabled) {
      return undefined;
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    const handleScriptLoad = () => {
      initializeGoogleButton();
    };

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initializeGoogleButton();
      } else {
        existingScript.addEventListener('load', handleScriptLoad);
      }

      return () => {
        existingScript.removeEventListener('load', handleScriptLoad);
      };
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', () => {
      setGoogleScriptError('No se pudo cargar Google Sign-In. Verifica la configuración en producción.');
    });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleScriptLoad);
    };
  }, [isGoogleEnabled]);

  // Re-renderizar botones de Google al cambiar de tab
  useEffect(() => {
    if (!isGoogleEnabled || !googleInitializedRef.current) return;
    renderGoogleButtons();
  }, [activeTab, isGoogleEnabled]);

  const handleLogin = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const data = await loginUser({ email, password });
      login(data.user);
      navigate(getPostLoginPath(data.user));
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMsg('Las contrasenas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await registerUser({ email, password, fullName: name });
      const data = await loginUser({ email, password });
      login(data.user);
      navigate(getPostLoginPath(data.user));
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setForgotSuccessMsg('');

    try {
      const response = await forgotPassword(forgotEmail);
      const message = response?.message || 'Solicitud procesada.';
      setForgotSuccessMsg(message);
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setResetSuccessMsg('');

    if (!resetToken.trim()) {
      setIsSubmitting(false);
      setErrorMsg('El enlace de restablecimiento no es válido o ya expiró. Solicita uno nuevo.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setIsSubmitting(false);
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    try {
      const response = await resetPassword({
        token: resetToken,
        newPassword: resetNewPassword,
      });
      setResetSuccessMsg(response?.message || 'Contraseña actualizada correctamente.');
      setAuthView('tabs');
      setActiveTab('login');
      setPassword('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetToken('');
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToAuthTabs = () => {
    setAuthView('tabs');
    setErrorMsg('');
    setForgotSuccessMsg('');
    setResetSuccessMsg('');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] text-[color:var(--text)] px-4 py-10 md:py-14 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="inline-flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-purple-600 w-16 h-16 text-white font-bold text-xl shadow-xl">
            MD
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Móvil Dev</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)] max-w-md mx-auto">
              Inicia sesión para seguir con tu compra y acceder a tus pedidos, descuentos y favoritos.
            </p>
          </div>
        </div>

        <div
          className={`mx-auto w-full rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl overflow-hidden transition-all duration-300 ${
            activeTab === 'login' ? 'max-w-lg' : 'max-w-xl'
          }`}
        >
          <div className="flex bg-[color:var(--surface-muted)] p-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition ${
                activeTab === 'login'
                  ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm'
                  : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition ${
                activeTab === 'register'
                  ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm'
                  : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
              }`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-6 md:p-8">
            {errorMsg && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {errorMsg}
              </p>
            )}

            {forgotSuccessMsg && authView === 'forgot' && (
              <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {forgotSuccessMsg}
              </p>
            )}

            {resetSuccessMsg && authView === 'reset' && (
              <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {resetSuccessMsg}
              </p>
            )}

            {authView === 'tabs' && activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="mx-auto max-w-md space-y-6">
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
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('forgot');
                      setForgotEmail(email);
                      setErrorMsg('');
                      setForgotSuccessMsg('');
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {isSubmitting ? 'Procesando...' : 'Iniciar Sesion'}
                </button>

                <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
                  <span className="h-px flex-1 bg-[color:var(--border)]" />
                  o
                  <span className="h-px flex-1 bg-[color:var(--border)]" />
                </div>

                <div className="flex justify-center">
                  {isGoogleEnabled ? <div ref={googleButtonRef} className="min-h-10" /> : null}
                </div>

                {!isGoogleEnabled ? (
                  <p className="text-center text-xs text-amber-700">
                    Google Sign-In no está disponible: falta la variable VITE_GOOGLE_CLIENT_ID en el entorno de producción.
                  </p>
                ) : null}

                {googleScriptError ? (
                  <p className="text-center text-xs text-red-700">{googleScriptError}</p>
                ) : null}
              </form>
            ) : null}

            {authView === 'tabs' && activeTab === 'register' ? (
              <form onSubmit={handleRegister} className="mx-auto max-w-lg space-y-6">
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
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {isSubmitting ? 'Procesando...' : 'Crear cuenta'}
                </button>

                <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
                  <span className="h-px flex-1 bg-[color:var(--border)]" />
                  o
                  <span className="h-px flex-1 bg-[color:var(--border)]" />
                </div>

                <div className="flex justify-center">
                  {isGoogleEnabled ? <div ref={googleButtonRegisterRef} className="min-h-10" /> : null}
                </div>

                {!isGoogleEnabled ? (
                  <p className="text-center text-xs text-amber-700">
                    Google Sign-In no está disponible: falta la variable VITE_GOOGLE_CLIENT_ID en el entorno de producción.
                  </p>
                ) : null}

                {googleScriptError ? (
                  <p className="text-center text-xs text-red-700">{googleScriptError}</p>
                ) : null}
              </form>
            ) : null}

            {authView === 'forgot' ? (
              <form onSubmit={handleForgotPassword} className="mx-auto max-w-md space-y-6">
                <button
                  type="button"
                  onClick={goBackToAuthTabs}
                  className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]"
                >
                  <ArrowLeft className="size-4" />
                  Volver
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-[color:var(--text)]">Recuperar contraseña</h2>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    Ingresa tu correo para generar un token de recuperación.
                  </p>
                </div>

                <label className="block text-sm font-medium text-[color:var(--text)]">
                  Email
                  <div className="mt-2 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {isSubmitting ? 'Procesando...' : 'Generar token'}
                </button>
              </form>
            ) : null}

            {authView === 'reset' ? (
              <form onSubmit={handleResetPassword} className="mx-auto max-w-md space-y-6">
                <button
                  type="button"
                  onClick={goBackToAuthTabs}
                  className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]"
                >
                  <ArrowLeft className="size-4" />
                  Volver
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-[color:var(--text)]">Restablecer contraseña</h2>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    Define una nueva contraseña para tu cuenta.
                  </p>
                </div>

                <label className="block text-sm font-medium text-[color:var(--text)]">
                  Nueva contraseña
                  <div className="mt-2 relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="********"
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-12 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
                      aria-label={showResetPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showResetPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>

                <label className="block text-sm font-medium text-[color:var(--text)]">
                  Confirmar nueva contraseña
                  <div className="mt-2 relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                    <input
                      type={showResetConfirmPassword ? 'text' : 'password'}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="********"
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 pl-12 pr-12 text-[color:var(--text)] outline-none transition focus:border-purple-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
                      aria-label={showResetConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showResetConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {isSubmitting ? 'Procesando...' : 'Actualizar contraseña'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
