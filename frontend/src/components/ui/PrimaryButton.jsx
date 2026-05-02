import { Loader2 } from 'lucide-react';

/**
 * PrimaryButton — botón CTA principal con gradiente y soporte de loading.
 *
 * @param {boolean} loading     - Muestra spinner y deshabilita el botón
 * @param {boolean} disabled    - Deshabilita el botón
 * @param {'button'|'submit'|'reset'} type
 * @param {string} className    - Clases extra
 * @param {React.ReactNode} children
 */
export default function PrimaryButton({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-700 to-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-purple-500/25 transition hover:-translate-y-0.5 hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
