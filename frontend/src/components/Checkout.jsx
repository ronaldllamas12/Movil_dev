import { useEffect, useState } from "react";
import { useCarrito } from "../context/CarritoContext";

export default function Checkout() {
  const { total } = useCarrito();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar script de ePayco solo una vez
  useEffect(() => {
    if (!document.getElementById('epayco-script')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.epayco.co/checkout.js';
      script.id = 'epayco-script';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total: total.toFixed(2) })
      });
      if (!res.ok) throw new Error("Error al crear la orden");
      const data = await res.json();
      if (!data.url) throw new Error("No se recibió URL de PayPal");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Error desconocido");
      setLoading(false);
    }
  };

  const handleEpayco = () => {
    setError("");
    setLoading(true);
    const monto = Math.round(total);
    if (monto > 200000) {
      setError('El monto máximo permitido para pagar con ePayco es $200.000 COP. Reduce el total para continuar.');
      setLoading(false);
      return;
    }
    if (!window.ePayco) {
      setError('No se pudo cargar ePayco. Intenta de nuevo.');
      setLoading(false);
      return;
    }
    const handler = window.ePayco.checkout.configure({
      key: import.meta.env.VITE_EPAYCO_PUBLIC_KEY,
      test: true, // Cambia a false en producción
    });
    handler.open({
      external: true,
      amount: monto,
      name: 'Pago en MOVIL-DEV',
      description: 'Compra de productos',
      currency: 'COP',
      country: 'CO',
      invoice: 'ORD-' + Date.now(),
      response: window.location.origin + '/success',
      confirmation: window.location.origin + '/success',
      cancelled: window.location.origin + '/cancel',
      lang: 'es',
      tax: '0',
      tax_base: '0',
      // Puedes agregar más campos según tu integración
    });
    setTimeout(() => setLoading(false), 2000); // UX: loading breve
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all">
        <h2 className="text-2xl font-bold text-white mb-4">Checkout</h2>
        <p className="text-lg text-white mb-6">Total a pagar: <span className="font-semibold">${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span></p>
        <div className="flex flex-col gap-4 w-full">
          <button
            className="w-full py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-lg font-bold text-[#0B0B0F] shadow-xl transition-all disabled:opacity-60"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? 'Redirigiendo a PayPal...' : 'Pagar con PayPal'}
          </button>
          <button
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-lg font-bold text-white shadow-xl transition-all disabled:opacity-60"
            onClick={handleEpayco}
            disabled={loading}
            type="button"
          >
            {loading ? 'Cargando ePayco...' : 'Pagar con ePayco'}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
}