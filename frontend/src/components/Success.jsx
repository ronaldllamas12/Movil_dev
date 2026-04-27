import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/axiosClient';
import { capturePayPalOrder } from '../api/services/paymentService';
import { useCarrito } from '../context/CarritoContext';

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { limpiarCarrito } = useCarrito();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const processedPaymentRef = useRef(false);

  useEffect(() => {
    if (processedPaymentRef.current) {
      return;
    }

    processedPaymentRef.current = true;

    const provider = searchParams.get('provider');
    const token = searchParams.get('token');

    const finishEpayco = async () => {
      const reference = searchParams.get('ref_payco') || searchParams.get('x_ref_payco') || '';
      setSuccess(true);
      setOrderId(reference);
      await limpiarCarrito();
      setLoading(false);
    };

    const finishPayPal = async () => {
      if (!token) {
        setError('Token no encontrado');
        setLoading(false);
        return;
      }

      try {
        const data = await capturePayPalOrder(token);
        if (data.success) {
          setSuccess(true);
          setOrderId(data.order_id || data.id || '');
          await limpiarCarrito();
        } else {
          setError('Error en el pago');
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
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
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all">
        <h2 className="text-2xl font-bold text-white mb-4">Pago</h2>
        {loading && <p className="text-white">Procesando pago...</p>}
        {!loading && success && (
          <>
            <p className="text-green-400 font-semibold text-lg">Pago exitoso</p>
            {orderId && <p className="text-white text-sm mt-2">N° de orden: <span className="font-mono text-yellow-300">{orderId}</span></p>}
          </>
        )}
        {!loading && error && <p className="text-red-400 font-semibold text-lg">{error}</p>}
        <button
          className="mt-8 w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-xl transition-all"
          onClick={() => navigate('/')}
        >
          Volver al catálogo
        </button>
      </div>
    </div>
  );
}
