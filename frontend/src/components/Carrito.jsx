import { ArrowLeft, BadgeCheck, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Trash2, Truck } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';

export default function Carrito() {
  const navigate = useNavigate();
  const { 
    carrito, 
    eliminarDelCarrito, 
    actualizarCantidad, 
    isCartLoading,
    cartError,
    subtotal, 
    descuentoTotal,
    costoEnvio, 
    iva, 
    total,
    cartTaxPercent,
    isLoggedIn,
    isAuthLoading,
  } = useCarrito();

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isAuthLoading, isLoggedIn, navigate]);

  if (isAuthLoading || !isLoggedIn) return null;

  if (isCartLoading) {
    return (
      <section className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] px-6 py-20">
        <div className="mx-auto flex max-w-3xl items-center justify-center rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-[color:var(--text)] shadow-xl">
          <Loader2 className="mr-3 size-6 animate-spin text-purple-600" />
          <h2 className="text-xl font-semibold">Cargando carrito...</h2>
        </div>
      </section>
    );
  }

  if (carrito.length === 0) {
    return (
      <section className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] px-6 py-16">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl">
          <div className="grid items-center gap-8 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-12">
            <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#12051f] via-[#31105f] to-[#020617]">
              <div className="absolute inset-x-10 bottom-6 h-20 rounded-full bg-purple-500/30 blur-3xl" />
              <img
                src="https://res.cloudinary.com/dms34zmay/image/upload/v1777228417/u015tu0fpx2xuo84zkeg.png"
                alt="Carrito vacío"
                className="relative z-10 h-64 w-64 object-contain drop-shadow-2xl"
              />
            </div>

            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
                <ShoppingBag className="size-4" />
                Tu selección espera
              </span>
              <h1 className="mt-5 text-3xl font-bold text-[color:var(--text)] md:text-5xl">Tu carrito está vacío</h1>
              {cartError ? <p className="mt-4 text-sm text-red-600">{cartError}</p> : null}
              <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
                Explora el catálogo y arma tu próxima compra con equipos destacados, envío seguro y checkout rápido.
              </p>
              <Link
                to="/catalogo"
                className="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-700 to-slate-950 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-purple-500/20 transition hover:-translate-y-0.5 hover:shadow-purple-500/30"
              >
                <ArrowLeft className="size-4" />
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] px-4 py-8 text-[color:var(--text)] md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl">
          <div className="relative isolate px-6 py-8 md:px-8">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(124,58,237,0.16),transparent_30%),linear-gradient(135deg,rgba(124,58,237,0.08),transparent_45%)]" />
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 transition hover:text-purple-500"
                >
                  <ArrowLeft className="size-4" />
                  Seguir comprando
                </Link>
                <h1 className="mt-4 text-4xl font-bold tracking-normal text-[color:var(--text)] md:text-5xl">Carrito de compras</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)] md:text-base">
                  Revisa tu selección, ajusta cantidades y confirma el total antes de continuar al pago.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 shadow-sm">
                <div className="rounded-xl bg-[color:var(--surface-muted)] px-3 py-3 text-center">
                  <p className="text-xl font-bold">{carrito.length}</p>
                  <p className="text-[11px] font-medium text-[color:var(--muted)]">productos</p>
                </div>
                <div className="rounded-xl bg-[color:var(--surface-muted)] px-3 py-3 text-center">
                  <p className="text-xl font-bold">{cartTaxPercent}%</p>
                  <p className="text-[11px] font-medium text-[color:var(--muted)]">IVA</p>
                </div>
                <div className="rounded-xl bg-[color:var(--surface-muted)] px-3 py-3 text-center">
                  <p className="text-xl font-bold">{costoEnvio === 0 ? 'Free' : 'COP'}</p>
                  <p className="text-[11px] font-medium text-[color:var(--muted)]">envío</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {cartError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {cartError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-4">
            {carrito.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                <div className="grid gap-4 p-4 sm:grid-cols-[8.5rem_1fr] sm:p-5">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
                    <img
                      src={item.image}
                      alt={item.nombre}
                      className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col justify-between gap-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-purple-700">
                          <Sparkles className="size-3" />
                          Seleccionado
                        </div>
                        <h3 className="text-lg font-bold leading-tight text-[color:var(--text)] md:text-xl">
                          {item.nombre}
                        </h3>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          {item.referencia || 'Sin referencia'}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xl font-extrabold text-[color:var(--text)]">
                          {formatCurrency(item.precio)}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--muted)]">Precio unitario</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex w-fit items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1">
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(item.id, -1)}
                          className="flex size-9 items-center justify-center rounded-full text-[color:var(--text)] transition hover:bg-[color:var(--surface)]"
                          aria-label={`Restar una unidad de ${item.nombre}`}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(item.id, 1)}
                          className="flex size-9 items-center justify-center rounded-full bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm transition hover:text-purple-600"
                          aria-label={`Agregar una unidad de ${item.nombre}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <p className="text-sm text-[color:var(--muted)]">
                          Total item: <span className="font-bold text-[color:var(--text)]">{formatCurrency(item.precio * item.cantidad)}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(item.id)}
                          className="flex size-10 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                          aria-label={`Eliminar ${item.nombre}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-2xl lg:sticky lg:top-28">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">Resumen</p>
                <h2 className="mt-1 text-2xl font-bold text-[color:var(--text)]">Orden segura</h2>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-700 to-slate-950 text-white shadow-lg shadow-purple-500/20">
                <ShieldCheck className="size-5" />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm">
              <div className="flex items-center justify-between gap-4 text-[color:var(--muted)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[color:var(--text)]">{formatCurrency(subtotal)}</span>
              </div>

              {descuentoTotal > 0 ? (
                <div className="flex items-center justify-between gap-4 text-emerald-600">
                  <span>Descuento</span>
                  <span className="font-semibold">- {formatCurrency(descuentoTotal)}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 text-[color:var(--muted)]">
                <span>Envío</span>
                <span className="font-semibold text-[color:var(--text)]">
                  {costoEnvio === 0 ? 'Gratis' : formatCurrency(costoEnvio)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4 text-[color:var(--muted)]">
                <span>IVA ({cartTaxPercent}%)</span>
                <span className="font-semibold text-[color:var(--text)]">{formatCurrency(iva)}</span>
              </div>

              <div className="flex items-end justify-between gap-4 pt-1">
                <span className="text-base font-bold text-[color:var(--text)]">Total</span>
                <span className="text-2xl font-extrabold text-[color:var(--text)]">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <BadgeCheck className="mt-0.5 size-4 shrink-0" />
                <span>Productos protegidos y datos de pago tratados con conexión segura.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                <Truck className="mt-0.5 size-4 shrink-0" />
                <span>El costo final de envío se confirma antes de pagar.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout-steps')}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-700 to-slate-950 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-purple-500/25 transition hover:-translate-y-0.5 hover:shadow-purple-500/35"
            >
              Finalizar compra
            </button>

            <Link
              to="/catalogo"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] px-5 py-3 text-sm font-semibold text-[color:var(--text)] transition hover:bg-[color:var(--surface-muted)]"
            >
              <ArrowLeft className="size-4" />
              Seguir comprando
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
