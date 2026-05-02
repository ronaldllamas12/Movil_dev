/**
 * InputWithIcon — input con ícono izquierdo y mensaje de error opcional.
 *
 * @param {React.ReactNode} icon  - Icono de lucide-react u otro
 * @param {string} error          - Mensaje de error (muestra borde rojo)
 * @param {string} className      - Clases extra para el <input>
 * Props adicionales se pasan directamente al <input>.
 */
export default function InputWithIcon({ icon, error, className = '', ...inputProps }) {
  return (
    <div className="mt-2 relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)] pointer-events-none">
        {icon}
      </span>
      <input
        {...inputProps}
        className={`w-full rounded-2xl border bg-[color:var(--surface-muted)] py-3 pl-12 pr-4 text-[color:var(--text)] outline-none transition ${
          error
            ? 'border-red-500 focus:border-red-600'
            : 'border-[color:var(--border)] focus:border-purple-600'
        } ${className}`}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <span>✕</span> {error}
        </p>
      )}
    </div>
  );
}
