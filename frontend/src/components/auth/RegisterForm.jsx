import { Mail, User } from 'lucide-react';
import GoogleSignInSection from './GoogleSignInSection';
import PasswordInput from './PasswordInput';

export default function RegisterForm({
  name,
  handleNameChange,
  nameError,
  email,
  handleEmailChange,
  emailError,
  password,
  handlePasswordChange,
  passwordError,
  confirmPassword,
  handleConfirmPasswordChange,
  confirmPasswordError,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isSubmitting,
  isRegisterFormValid,
  onSubmit,
  errorMsg,
  isGoogleEnabled,
  googleButtonRegisterRef,
  googleScriptError,
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--text)]">Crear Cuenta</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Regístrate para comenzar a comprar celulares y guardar tus favoritos.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[color:var(--text)]">
          Nombre
          <div className="mt-2 relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tu nombre completo"
              className={`w-full rounded-2xl border bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none transition ${
                nameError
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-[color:var(--border)] focus:border-purple-600'
              }`}
              required
            />
          </div>
          {nameError && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block">✕</span> {nameError}
            </p>
          )}
        </label>

        <label className="block text-sm font-medium text-[color:var(--text)]">
          Email
          <div className="mt-2 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="tu@email.com"
              className={`w-full rounded-2xl border bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none transition ${
                emailError
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-[color:var(--border)] focus:border-purple-600'
              }`}
              required
            />
          </div>
          {emailError && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block">✕</span> {emailError}
            </p>
          )}
        </label>

        <PasswordInput
          label="Contraseña"
          value={password}
          onChange={handlePasswordChange}
          show={showPassword}
          onToggleShow={() => setShowPassword((p) => !p)}
          placeholder="Mínimo 8 caracteres"
          error={passwordError}
        />

        <PasswordInput
          label="Confirmar contraseña"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          show={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword((p) => !p)}
          placeholder="Repite tu contraseña"
          error={confirmPasswordError}
        />
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !isRegisterFormValid()}
        className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Procesando...' : 'Crear cuenta'}
      </button>

      <GoogleSignInSection
        isGoogleEnabled={isGoogleEnabled}
        googleScriptError={googleScriptError}
        googleButtonRef={googleButtonRegisterRef}
      />
    </form>
  );
}
