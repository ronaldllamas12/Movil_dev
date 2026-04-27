import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isAuthLoading, isLoggedIn, navigate]);

  if (isAuthLoading || !isLoggedIn) return null;

  if (isCartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Cargando carrito...</h2>
      </div>
    );
  }

  if (carrito.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-black shadow-lg shadow-purple-500/20 p-4 rounded-full"><img
          src="https://res.cloudinary.com/dms34zmay/image/upload/v1777228417/u015tu0fpx2xuo84zkeg.png"
          alt="checkout"
          className="size-50"
        />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Tu carrito está vacío</h2>
        {cartError && <p className="text-red-500 mb-8">{cartError}</p>}
        <p className="text-gray-500 mb-10"> Vamos Agregar productos para comenzar !!!</p>
        <Link to="/catalogo" className="inline-flex items-center gap-4 bg-gradient-to-r from-purple-600 to-black shadow-lg shadow-purple-500/20 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition">
          <ArrowLeft size={18} />
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-gradient-to-b from-white to-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Carrito</h1>
        <span className="text-sm text-gray-500">
          {carrito.length} productos
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* 🛒 PRODUCTOS */}
        <div className="lg:col-span-2 space-y-6">
          {carrito.map((item) => (
            <div
              key={item.id}
              className="group flex gap-6 bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              
              {/* IMAGEN */}
              <div className="w-28 h-28 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.nombre}
                  className="w-full h-full object-contain group-hover:scale-110 transition"
                />
              </div>

              {/* INFO */}
              <div className="flex-1 flex flex-col justify-between">
                
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {item.nombre}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {item.referencia || "Sin referencia"}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  
                  {/* PRECIO */}
                  <p className="text-xl font-bold text-gray-900">
                    ${item.precio.toLocaleString()}
                  </p>

                  {/* CONTROLES */}
                  <div className="flex items-center gap-3">
                    
                    {/* Cantidad */}
                    <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 shadow-inner">
                      <button
                        onClick={() => actualizarCantidad(item.id, -1)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="mx-3 font-semibold text-sm">
                        {item.cantidad}
                      </span>

                      <button
                        onClick={() => actualizarCantidad(item.id, 1)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 💳 RESUMEN */}
        <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xl h-fit sticky top-24">
          
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Resumen
          </h2>

          <div className="space-y-4 text-sm text-gray-600">

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">
                ${subtotal.toLocaleString()}
              </span>
            </div>

            {descuentoTotal > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento</span>
                <span>- ${descuentoTotal.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Envío</span>
              <span className="font-medium">
                {costoEnvio === 0 ? "Gratis" : `$${costoEnvio.toLocaleString()}`}
              </span>
            </div>

            <div className="flex justify-between border-b pb-4">
              <span>IVA ({cartTaxPercent}%)</span>
              <span>${iva.toLocaleString()}</span>
            </div>

            {/* TOTAL */}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          {/* BOTONES */}
          <div className="mt-8 space-y-3">
            
            <button
              onClick={() => navigate('/checkout-steps')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-800 to-black shadow-lg shadow-purple-500/20 text-white font-bold hover:scale-[1.1] shadow-lg transition-all"
            >
              Finalizar compra
            </button>

            <Link
              to="/catalogo"
              className="block text-center text-sm text-gray-500 hover:text-gray-800 transition"
            >
              Seguir comprando
            </Link>
          </div>

          {/* CUPÓN */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm mb-2 text-gray-500">Cupón</p>
            <div className="flex gap-2">
              <input
                placeholder="Código"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
              />
              <button className="bg-black text-white px-4 rounded-xl text-sm hover:opacity-90">
                OK
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}