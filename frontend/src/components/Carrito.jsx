import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';

export default function Carrito() {
  const navigate = useNavigate();
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const { 
    carrito, 
    eliminarDelCarrito, 
    actualizarCantidad, 
    isCartLoading,
    cartError,
    subtotal, 
    descuentoTotal,
    subtotalConDescuento,
    costoEnvio, 
    iva, 
    total,
    cartTaxPercent,
    isLoggedIn,
    isAuthLoading,
  } = useCarrito();

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isAuthLoading, isLoggedIn, navigate]);

  if (isAuthLoading || (!isLoggedIn)) {
    return null;
  }

  if (isCartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-[color:var(--text)]">Cargando carrito...</h2>
      </div>
    );
  }

  if (carrito.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-[color:var(--surface-muted)] p-6 rounded-full">
            <ShoppingBag className="size-12 text-[color:var(--muted)]" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-[color:var(--text)] mb-4">Tu carrito está vacío</h2>
        {cartError ? (
          <p className="text-red-500 mb-4">{cartError}</p>
        ) : null}
        <p className="text-[color:var(--muted)] mb-8">Parece que aún no has añadido ningún producto.</p>
        <Link to="/catalogo" className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition">
          <ArrowLeft className="size-5" />
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-[color:var(--text)] mb-8">Mi Carrito ({carrito.length})</h1>
      {cartError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{cartError}</p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LISTA DE PRODUCTOS (Columna Izquierda) */}
        <div className="lg:col-span-2 space-y-4">
          {carrito.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-[color:var(--surface)] p-4 rounded-2xl border border-[color:var(--border)] shadow-sm">
              <img 
                src={item.image} 
                alt={item.nombre} 
                className="w-24 h-24 object-contain bg-[color:var(--surface-muted)] rounded-lg"
              />
              
              <div className="flex-1">
                <h3 className="font-bold text-[color:var(--text)] text-lg">{item.nombre}</h3>
                {item.referencia ? (
                  <p className="text-xs text-[color:var(--muted)]">Ref: {item.referencia}</p>
                ) : null}
                <p className="text-purple-600 font-bold">$ {item.precio.toLocaleString()
                }</p>
              </div>

              {/* Controles de Cantidad */}
              <div className="flex items-center gap-3 bg-[color:var(--surface-muted)] p-2 rounded-xl">
                <button 
                  onClick={() => actualizarCantidad(item.id, -1)}
                  className="p-1 hover:bg-[color:var(--surface-hover)] rounded-lg transition"
                >
                  <Minus className="size-4 text-[color:var(--muted)]" />
                </button>
                <span className="font-bold text-[color:var(--text)] min-w-[20px] text-center">
                  {item.cantidad}
                </span>
                <button 
                  onClick={() => actualizarCantidad(item.id, 1)}
                  className="p-1 hover:bg-[color:var(--surface-hover)] rounded-lg transition"
                >
                  <Plus className="size-4 text-[color:var(--muted)]" />
                </button>
              </div>

              <button 
                onClick={() => eliminarDelCarrito(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          ))}
        </div>

        {/* RESUMEN DE COMPRA (Columna Derecha) */}
        <div className="bg-purple-600 text-white p-8 rounded-[2rem] h-fit sticky top-24">
          <h2 className="text-xl font-bold mb-6">Resumen de compra</h2>
          
          <div className="space-y-4 text-purple-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white font-medium">${subtotal.toLocaleString()}</span>
            </div>
            {descuentoTotal > 0 && (
              <div className="flex justify-between">
                <span>Descuentos</span>
                <span className="text-green-300 font-medium">-${descuentoTotal.toLocaleString()}</span>
              </div>
            )}
            {descuentoTotal > 0 && (
              <div className="flex justify-between">
                <span>Subtotal con descuento</span>
                <span className="text-white font-medium">${subtotalConDescuento.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Envío</span>
              <span className={costoEnvio === 0 ? "text-green-300 font-medium" : "text-white font-medium"}>
                {costoEnvio === 0 ? "Gratis" : `$${costoEnvio.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between border-b border-purple-400 pb-4">
              <span>IVA ({cartTaxPercent}%)</span>
              <span className="text-white font-medium">${iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white pt-2">
              <span>Total</span>
              <span className="text-yellow-300">${total.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  navigate('/login');
                  return;
                }
                setCheckoutMessage('Estás listo para pagar. Aquí solo simulamos el flujo de checkout.');
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-purple-900/20"
            >
              {isLoggedIn ? 'Finalizar Compra' : 'Iniciar sesión para pagar'}
            </button>
            {checkoutMessage && (
              <p className="text-sm text-emerald-200 bg-white/10 rounded-xl p-3">
                {checkoutMessage}
              </p>
            )}
            <Link 
              to="/catalogo" 
              className="block w-full text-center text-gray-400 hover:text-white py-2 text-sm transition"
            >
              Continuar comprando
            </Link>
          </div>

          {/* Cupón de descuento */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-sm mb-3">¿Tienes un cupón?</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Código" 
                className="bg-slate-800 border-none rounded-lg px-4 py-2 w-full focus:ring-1 focus:ring-purple-500 outline-none"
              />
              <button className="bg-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-600 transition">
                Aplicar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}