const FALLBACK_IMAGE = 'https://placehold.co/400x400?text=Producto';

function formatPrice(value) {
  const numericValue = Number(value || 0);

  return numericValue.toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  });
}

export function toProductCardModel(product) {
  const mapped = mapProductFromApi(product);
  if (!mapped) return null;

  return {
    ...mapped,
    image: mapped.imagen_url || mapped.image || FALLBACK_IMAGE,
    oldPrice: null,
    discount: null,
    rating: 4.7,
    reviews: 0,
  };
}






/**
 * Transforma un producto de la API (snake_case) al formato del frontend (camelCase o como lo necesites)
 */
export function mapProductFromApi(apiProduct) {
  if (!apiProduct) return null;
  
  // Procesar colores disponibles (puede venir como string JSON o array)
  let coloresDisponibles = [];
  if (apiProduct.colores_disponibles) {
    if (typeof apiProduct.colores_disponibles === 'string') {
      try {
        coloresDisponibles = JSON.parse(apiProduct.colores_disponibles);
      } catch (e) {
        console.error('Error parsing colores_disponibles:', e);
        coloresDisponibles = [];
      }
    } else if (Array.isArray(apiProduct.colores_disponibles)) {
      coloresDisponibles = apiProduct.colores_disponibles;
    }
  }

  let colorVariants = [];
  if (apiProduct.color_variants) {
    if (typeof apiProduct.color_variants === 'string') {
      try {
        colorVariants = JSON.parse(apiProduct.color_variants);
      } catch (e) {
        console.error('Error parsing color_variants:', e);
        colorVariants = [];
      }
    } else if (Array.isArray(apiProduct.color_variants)) {
      colorVariants = apiProduct.color_variants;
    }
  }

  colorVariants = colorVariants
    .filter((variant) => variant && typeof variant === 'object')
    .map((variant) => ({
      color: String(variant.color || '').trim(),
      image_url: variant.image_url ? String(variant.image_url).trim() : null,
      stock: Number(variant.stock || 0),
    }))
    .filter((variant) => variant.color);

  if (colorVariants.length > 0) {
    coloresDisponibles = colorVariants.map((variant) => variant.color);
  }

  const precio = Number(apiProduct.precio_unitario || 0);

  return {
    // Datos básicos
    id: apiProduct.id,
    referencia: apiProduct.referencia,
    marca: apiProduct.marca,
    nombre: apiProduct.nombre,
    categoria: apiProduct.categoria,
    descripcion_breve: apiProduct.descripcion_breve,
    cantidad_stock: apiProduct.cantidad_stock,
    precio: precio,
    precio_unitario: precio,
    formattedPrice: formatPrice(precio),
    
    // Especificaciones
    tamano_memoria_ram: apiProduct.tamano_memoria_ram,
    rom: apiProduct.rom,
    colores_disponibles: coloresDisponibles,
    color_variants: colorVariants,
    conectividad: apiProduct.conectividad,
    procesador: apiProduct.procesador,
    dimensiones: apiProduct.dimensiones,
    bateria: apiProduct.bateria,
    resolucion_camara_principal: apiProduct.resolucion_camara_principal,
    resolucion_camara_frontal: apiProduct.resolucion_camara_frontal,
    capacidad_carga_rapida: apiProduct.capacidad_carga_rapida,
    garantia_meses: apiProduct.garantia_meses,
    
    // Imágenes y estado
    imagen_url: apiProduct.imagen_url,
    image: apiProduct.imagen_url, // Para compatibilidad
    is_active: apiProduct.is_active,
    is_featured: apiProduct.is_featured,
    
    // Timestamps
    created_at: apiProduct.created_at,
    updated_at: apiProduct.updated_at
  };
}

/**
 * Transforma una lista de productos de la API
 */
export function mapProductsFromApi(apiProducts) {
  if (!Array.isArray(apiProducts)) return [];
  return apiProducts.map(mapProductFromApi);
}

/**
 * Transforma un producto del frontend al formato de la API (para crear/actualizar)
 */
export function mapProductToApi(frontendProduct) {
  const colorVariants = Array.isArray(frontendProduct.color_variants)
    ? frontendProduct.color_variants
        .map((variant) => ({
          color: String(variant?.color || '').trim(),
          image_url: variant?.image_url ? String(variant.image_url).trim() : null,
          stock: Number(variant?.stock || 0),
        }))
        .filter((variant) => variant.color)
    : [];

  return {
    referencia: frontendProduct.referencia,
    marca: frontendProduct.marca,
    nombre: frontendProduct.nombre,
    categoria: frontendProduct.categoria,
    descripcion_breve: frontendProduct.descripcion_breve,
    cantidad_stock: frontendProduct.cantidad_stock,
    precio_unitario: frontendProduct.precio_unitario || frontendProduct.precio,
    tamano_memoria_ram: frontendProduct.tamano_memoria_ram,
    rom: frontendProduct.rom,
    colores_disponibles: colorVariants.length > 0
      ? colorVariants.map((variant) => variant.color)
      : (frontendProduct.colores_disponibles || []),
    color_variants: colorVariants,
    conectividad: frontendProduct.conectividad,
    procesador: frontendProduct.procesador,
    dimensiones: frontendProduct.dimensiones,
    bateria: frontendProduct.bateria,
    resolucion_camara_principal: frontendProduct.resolucion_camara_principal,
    resolucion_camara_frontal: frontendProduct.resolucion_camara_frontal,
    capacidad_carga_rapida: frontendProduct.capacidad_carga_rapida,
    garantia_meses: frontendProduct.garantia_meses,
    imagen_url: frontendProduct.imagen_url,
    is_active: frontendProduct.is_active !== undefined ? frontendProduct.is_active : true,
    is_featured: frontendProduct.is_featured || false
  };
}