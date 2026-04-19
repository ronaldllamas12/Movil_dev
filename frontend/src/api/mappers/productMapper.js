const FALLBACK_IMAGE = 'https://placehold.co/400x400?text=Producto';

function formatPrice(value) {
  const numericValue = Number(value || 0);

  return numericValue.toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  });
}

export function toProductCardModel(product) {
  return {
    id: product.id,
    referencia: product.referencia,
    marca: product.marca,
    nombre: product.nombre,
    precio: formatPrice(product.precio_unitario),
    oldPrice: null,
    discount: null,
    rating: 4.7,
    reviews: 0,
    image: product.imagen_url || FALLBACK_IMAGE,
  };
}
