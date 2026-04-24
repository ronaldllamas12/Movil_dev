// components/ProductCard.jsx
import { Eye, ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import ProductDetailModal from './ProductDetailModal';

export default function ProductCard({ product }) {
  const { agregarAlCarrito } = useCarrito();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const stock = Number(product.cantidad_stock || 0);
  const isOutOfStock = stock <= 0;
  const priceLabel =
    product.formattedPrice ??
    (product.precio != null && product.precio !== ''
      ? String(product.precio)
      : '—');

  return (
    <>
      <div className="group bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-4 hover:shadow-xl transition-all duration-300">
        {/* Imagen y Badges */}
        <div className="relative aspect-square bg-[color:var(--surface-muted)] rounded-xl mb-4 overflow-hidden flex items-center justify-center">
          {product.discount && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
              -{product.discount}%
            </span>
          )}
          <span className="absolute top-2 left-2 bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg z-10 uppercase">
            Más Vendido
          </span>
          <img 
            src={product.imagen_url || product.image} 
            alt={product.nombre}
            className="w-40 h-40 object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Info */}
        <div className="space-y-1">
          <p className="text-xs text-[color:var(--muted)] uppercase font-semibold">{product.marca}</p>
          <h3 className="font-bold text-[color:var(--text)] truncate">{product.nombre}</h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-[color:var(--text)]">{product.rating ?? 4.5}</span>
            <span className="text-xs text-[color:var(--muted)]">({product.reviews || 0})</span>
          </div>

          {/* Precio */}
          <div className="pt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              ${priceLabel}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-400 line-through">${product.oldPrice}</span>
            )}
          </div>

          <p className={`pt-2 text-xs font-semibold ${isOutOfStock ? 'text-red-600' : stock <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isOutOfStock ? 'Sin stock disponible' : `Stock disponible: ${stock} unidad${stock === 1 ? '' : 'es'}`}
          </p>
        </div>

        {/* Botones */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-sm"
          >
            <Eye className="size-4" />
            Detalles
          </button>
          <button
            onClick={() => agregarAlCarrito(product)}
            disabled={isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-full active:scale-95 transition-all duration-200 shadow-sm ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
          >
            <ShoppingCart className="size-4" />
            {isOutOfStock ? 'Sin stock' : 'Añadir'}
          </button>
        </div>
      </div>

      {/* Modal de detalles */}
      <ProductDetailModal 
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}