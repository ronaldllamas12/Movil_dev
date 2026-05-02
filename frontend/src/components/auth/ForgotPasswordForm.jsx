import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordForm({
  forgotEmail,
  setForgotEmail,
  isSubmitting,
  onSubmit,
  onBack,
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-6">
      <button
        type="button"
        onClick={onBack}
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
  );
}
