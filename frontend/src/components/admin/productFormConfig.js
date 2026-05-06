export const CATEGORY_OPTIONS = ['premium', 'gama media', 'economico'];

export const BASE_CREATE_FORM = {
  marca: '',
  referencia: '',
  nombre: '',
  categoria: 'premium',
  descripcion_breve: '',
  cantidad_stock: '',
  precio_unitario: '',
  tamano_memoria_ram: '',
  rom: '',
  conectividad: '',
  procesador: '',
  dimensiones: '',
  bateria: '',
  resolucion_camara_principal: '',
  resolucion_camara_frontal: '',
  capacidad_carga_rapida: '',
  garantia_meses: '',
  imagen_url: '',
  colores_disponibles: '',
    color_variants: [],
  is_active: true,
  is_featured: false,
};

export const BASE_EDIT_FORM = {
  marca: '',
  referencia: '',
  nombre: '',
  categoria: 'premium',
  descripcion_breve: '',
  cantidad_stock: '',
  precio_unitario: '',
  tamano_memoria_ram: '',
  rom: '',
  conectividad: '',
  procesador: '',
  dimensiones: '',
  bateria: '',
  resolucion_camara_principal: '',
  resolucion_camara_frontal: '',
  capacidad_carga_rapida: '',
  garantia_meses: '',
  imagen_url: '',
  colores_disponibles: '',
    color_variants: [],
  is_active: true,
  is_featured: false,
};


export function toPayload(form) {
    const colorVariants = Array.isArray(form.color_variants) ? form.color_variants.filter((v) => v.color?.trim()) : [];
  const fallbackColors = form.colores_disponibles
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    marca: form.marca.trim(),
    referencia: form.referencia.trim(),
    nombre: form.nombre.trim(),
    categoria: form.categoria,
    descripcion_breve: form.descripcion_breve.trim(),
    cantidad_stock: colorVariants.length > 0
      ? colorVariants.reduce((acc, item) => acc + Number(item.stock || 0), 0)
      : Number(form.cantidad_stock || 0),
    precio_unitario: Number(form.precio_unitario || 0),
    tamano_memoria_ram: form.tamano_memoria_ram.trim(),
    rom: form.rom.trim(),
    colores_disponibles: colorVariants.length > 0
      ? colorVariants.map((variant) => variant.color)
      : fallbackColors,
    color_variants: colorVariants,
    conectividad: form.conectividad.trim(),
    procesador: form.procesador.trim(),
    dimensiones: form.dimensiones.trim(),
    bateria: form.bateria.trim(),
    resolucion_camara_principal: form.resolucion_camara_principal.trim(),
    resolucion_camara_frontal: form.resolucion_camara_frontal.trim(),
    capacidad_carga_rapida: form.capacidad_carga_rapida.trim(),
    garantia_meses: Number(form.garantia_meses || 0),
    imagen_url: form.imagen_url.trim() || null,
    is_active: form.is_active,
    is_featured: form.is_featured,
  };
}

export function productToEditForm(product) {
  return {
    marca: product.marca || '',
    referencia: product.referencia || '',
    nombre: product.nombre || '',
    categoria: product.categoria || 'premium',
    descripcion_breve: product.descripcion_breve || '',
    cantidad_stock: String(product.cantidad_stock ?? ''),
    precio_unitario: String(product.precio_unitario ?? ''),
    tamano_memoria_ram: product.tamano_memoria_ram || '',
    rom: product.rom || '',
    conectividad: product.conectividad || '',
    procesador: product.procesador || '',
    dimensiones: product.dimensiones || '',
    bateria: product.bateria || '',
    resolucion_camara_principal: product.resolucion_camara_principal || '',
    resolucion_camara_frontal: product.resolucion_camara_frontal || '',
    capacidad_carga_rapida: product.capacidad_carga_rapida || '',
    garantia_meses: String(product.garantia_meses ?? ''),
    imagen_url: product.imagen_url || '',
    colores_disponibles: Array.isArray(product.colores_disponibles)
      ? product.colores_disponibles.join(', ')
      : '',
      color_variants: Array.isArray(product.color_variants) ? product.color_variants : [],
    is_active: Boolean(product.is_active),
    is_featured: Boolean(product.is_featured),
  };
}
