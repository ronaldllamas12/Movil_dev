import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner — spinner centrado con mensaje opcional.
 * @param {string} message - Texto junto al spinner
 * @param {string} className - Clases extra para el contenedor
 */
export default function LoadingSpinner({ message = 'Cargando...', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <Loader2 className="size-6 animate-spin text-purple-600" />
      {message && <span className="text-[color:var(--text)] font-semibold">{message}</span>}
    </div>
  );
}
