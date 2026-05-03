import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder = '********',
  error,
}) {
  return (
    <label className="block text-sm font-medium text-[color:var(--text)]">
      {label}
      <div className="mt-2 relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-[color:var(--surface-muted)] py-3 pl-12 pr-12 text-[color:var(--text)] outline-none transition ${
            error
              ? 'border-red-500 focus:border-red-600'
              : 'border-[color:var(--border)] focus:border-purple-600'
          }`}
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <span className="inline-block">✕</span> {error}
        </p>
      )}
    </label>
  );
}
