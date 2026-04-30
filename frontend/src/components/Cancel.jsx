import { ArrowLeft, RotateCcw, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cancel() {
  const navigate = useNavigate();
  return (
    <section className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] px-4 py-16 text-[color:var(--text)]">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl">
        <div className="relative isolate px-6 py-10 text-center md:px-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.16),transparent_35%)]" />
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle className="size-8" />
          </div>
          <h1 className="text-3xl font-bold text-[color:var(--text)]">Pago cancelado</h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            La transacción no se completó. Puedes volver al carrito y elegir otro método de pago sin abrir otra página.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-700 to-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-purple-500/20 transition hover:-translate-y-0.5"
              onClick={() => navigate('/carrito')}
            >
              <RotateCcw className="size-4" />
              Volver al carrito
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] px-5 py-3 text-sm font-bold text-[color:var(--text)] transition hover:bg-[color:var(--surface-muted)]"
              onClick={() => navigate('/catalogo')}
            >
              <ArrowLeft className="size-4" />
              Catálogo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
