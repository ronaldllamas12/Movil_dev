import { useNavigate } from 'react-router-dom';

export default function Cancel() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all">
        <h2 className="text-2xl font-bold text-white mb-4">Pago cancelado</h2>
        <p className="text-white mb-6">El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.</p>
        <button
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold shadow-xl transition-all"
          onClick={() => navigate('/carrito')}
        >
          Volver al carrito
        </button>
      </div>
    </div>
  );
}
