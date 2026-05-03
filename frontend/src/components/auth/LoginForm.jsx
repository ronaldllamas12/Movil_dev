import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import GoogleSignInSection from './GoogleSignInSection';

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  remember,
  setRemember,
  isSubmitting,
  onSubmit,
  onForgotPassword,
  isGoogleEnabled,
  googleButtonRef,
  googleScriptError,
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--text)]">Iniciar Sesión</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
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
        <button type="button" onClick={onForgotPassword} className="text-purple-600 hover:underline">
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

      <GoogleSignInSection
        isGoogleEnabled={isGoogleEnabled}
        googleScriptError={googleScriptError}
        googleButtonRef={googleButtonRef}
      />
    </form>
  );
}
