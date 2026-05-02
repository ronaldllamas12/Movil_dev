import { ArrowLeft } from 'lucide-react';
import PasswordInput from './PasswordInput';

export default function ResetPasswordForm({
  resetNewPassword,
  setResetNewPassword,
  resetConfirmPassword,
  setResetConfirmPassword,
  showResetPassword,
  setShowResetPassword,
  showResetConfirmPassword,
  setShowResetConfirmPassword,
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
        <h2 className="text-2xl font-bold text-[color:var(--text)]">Restablecer contraseña</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Define una nueva contraseña para tu cuenta.
        </p>
      </div>

      <PasswordInput
        label="Nueva contraseña"
        value={resetNewPassword}
        onChange={(v) => setResetNewPassword(v)}
        show={showResetPassword}
        onToggleShow={() => setShowResetPassword((p) => !p)}
      />

      <PasswordInput
        label="Confirmar nueva contraseña"
        value={resetConfirmPassword}
        onChange={(v) => setResetConfirmPassword(v)}
        show={showResetConfirmPassword}
        onToggleShow={() => setShowResetConfirmPassword((p) => !p)}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {isSubmitting ? 'Procesando...' : 'Actualizar contraseña'}
      </button>
    </form>
  );
}
