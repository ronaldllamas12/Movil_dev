/**
 * Alert component — muestra mensajes de error o éxito con estilo consistente.
 *
 * @param {'error' | 'success' | 'warning'} variant
 * @param {string | string[]} message
 * @param {string} className
 */
export default function Alert({ variant = 'error', message, className = '' }) {
  if (!message) return null;

  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  const messages = Array.isArray(message) ? message : [message];

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant]} ${className}`}
      role="alert"
    >
      {messages.map((msg, idx) => (
        <p key={idx}>{typeof msg === 'string' ? msg : msg?.msg || JSON.stringify(msg)}</p>
      ))}
    </div>
  );
}
