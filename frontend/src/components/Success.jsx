import { CheckCircle2, Home, Loader2, ShoppingBag, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/axiosClient';
import { capturePayPalOrder } from '../api/services/paymentService';
import { useCarrito } from '../context/CarritoContext';

const GENERIC_CART_INTACT_ERROR = 'Upps! Algo salió mal. Tu carrito quedó intacto.';

function buildCartIntactError(details) {
  const message = String(details || '').trim();
  return message ? `${GENERIC_CART_INTACT_ERROR} (${message})` : GENERIC_CART_INTACT_ERROR;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { limpiarCarrito } = useCarrito();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const processedPaymentRef = useRef(false);

  useEffect(() => {
    if (processedPaymentRef.current) {
      return;
    }

    processedPaymentRef.current = true;

    const provider = searchParams.get('provider');
    const token = searchParams.get('token');

    const finishEpayco = async () => {
      const responseCode = (
        searchParams.get('x_cod_response') ||
        searchParams.get('cod_response') ||
        searchParams.get('x_response_code') ||
        ''
      ).trim();
      const responseText = (
        searchParams.get('x_response') ||
        searchParams.get('response') ||
        searchParams.get('x_transaction_state') ||
        ''
      ).toLowerCase();
      const hasExplicitFailure = ['2', '4', '6', '7', '9', '10', '11'].includes(responseCode)
        || responseText.includes('rechaz')
        || responseText.includes('fall')
        || responseText.includes('cancel');
      const isApproved = !hasExplicitFailure && (
        !responseCode ||
        responseCode === '1' ||
        responseText.includes('acept')
      );

      if (isApproved) {
        setSuccess(true);
        await limpiarCarrito();
      } else {
        setError(GENERIC_CART_INTACT_ERROR);
      }

      setLoading(false);
    };

    const finishPayPal = async () => {
      if (!token) {
        setError(GENERIC_CART_INTACT_ERROR);
        setLoading(false);
        return;
      }

      try {
        const data = await capturePayPalOrder(token);
        if (data.success) {
          setSuccess(true);
          await limpiarCarrito();
        } else {
          setError(GENERIC_CART_INTACT_ERROR);
        }
      } catch (err) {
        setError(buildCartIntactError(getApiErrorMessage(err)));
      } finally {
        setLoading(false);
      }
    };

    if (provider === 'epayco') {
      finishEpayco();
      return;
    }

    finishPayPal();
  }, []);

  return (
    <section className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] px-4 py-16 text-[color:var(--text)]">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl">
        <div className="relative isolate px-6 py-10 text-center md:px-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.18),transparent_35%)]" />

          {loading && (
            <>
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Loader2 className="size-8 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-[color:var(--text)]">Procesando pago</h1>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Estamos confirmando la transacción. No necesitas abrir otra página.
              </p>
            </>
          )}

          {!loading && success && (
            <>
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>
              <h1 className="text-3xl font-bold text-[color:var(--text)]">Pago exitoso</h1>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Compra exitosa, vamos. Seguir mirando productos!!
              </p>
            </>
          )}

          {!loading && error && (
            <>
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <XCircle className="size-8" />
              </div>
              <h1 className="text-3xl font-bold text-[color:var(--text)]">No pudimos confirmar tu pago</h1>
              <p className="mt-3 text-sm leading-6 text-red-600">{error}</p>
            </>
          )}

          {!loading && success && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-700 to-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-purple-500/20 transition hover:-translate-y-0.5"
                onClick={() => navigate('/catalogo')}
              >
                <ShoppingBag className="size-4" />
                Seguir mirando productos
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] px-5 py-3 text-sm font-bold text-[color:var(--text)] transition hover:bg-[color:var(--surface-muted)]"
                onClick={() => navigate('/')}
              >
                <Home className="size-4" />
                Inicio
              </button>
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-700 to-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-purple-500/20 transition hover:-translate-y-0.5"
                onClick={() => navigate('/carrito')}
              >
                <ShoppingBag className="size-4" />
                Continuar pago
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] px-5 py-3 text-sm font-bold text-[color:var(--text)] transition hover:bg-[color:var(--surface-muted)]"
                onClick={() => navigate('/catalogo')}
              >
                <ShoppingBag className="size-4" />
                Agregar más productos
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
