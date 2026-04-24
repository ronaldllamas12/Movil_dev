// components/ProductDetailModal.jsx
import { Battery, Camera, Check, Cpu, HardDrive, MemoryStick, Ruler, Shield, ShoppingCart, Wifi, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { mapProductFromApi } from '../api/mappers/productMapper';
import { getProductById } from '../api/services/productsService';
import { useCarrito } from '../context/CarritoContext';

export default function ProductDetailModal({ product, isOpen, onClose }) {
  const { agregarAlCarrito } = useCarrito();
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [fullProduct, setFullProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar detalles completos del producto cuando se abre el modal
  useEffect(() => {
    if (isOpen && product && product.id) {
      const fetchFullProduct = async () => {
        setIsLoading(true);
        try {
          const productData = await getProductById(product.id);
          // Aplicar el mapper para transformar los datos
          const mappedProduct = mapProductFromApi(productData);
          setFullProduct(mappedProduct);
        //   console.log('Producto completo cargado:', mappedProduct); // Para depuración
        } catch (error) {
          console.error('Error cargando detalles del producto:', error);
          // Fallback: intentar mapear el producto que ya tenemos
          setFullProduct(product);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFullProduct();
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Usar fullProduct si está disponible, si no usar product
  const displayProduct = fullProduct || product;

  // Ya no necesitamos normalizeProduct porque el mapper ya lo hizo
  const normalizedProduct = displayProduct;

  // Mapeo de colores
  const colorClasses = {
    'Negro': 'bg-gray-900',
    'Azul': 'bg-blue-600',
    'Plata': 'bg-gray-300',
    'Blanco': 'bg-white border-2 border-gray-300',
    'Rosa': 'bg-pink-400',
    'Gris': 'bg-gray-500',
    'Verde': 'bg-green-600',
    'Marrón': 'bg-amber-800',
    'Violeta': 'bg-purple-600',
    'Morado': 'bg-purple-700',
    "rojo": 'bg-red-500'
  };

  const handleAddToCart = async () => {
    const productToAdd = {
      ...displayProduct,
      color_selected: selectedColor,
    };
    const wasAdded = await agregarAlCarrito(productToAdd, quantity);
    if (!wasAdded) {
      return;
    }

    setAddedToCart(true);
    window.setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (normalizedProduct.cantidad_stock || 999)) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-white bg-opacity-50" onClick={onClose} />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-white bg-opacity-100 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-red rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-red-300 rounded-full shadow-lg hover:bg-red-500 transition-colors"
          >
            <X className="size-5" />
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Imagen del producto */}
            <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-center">
              <img 
                src={normalizedProduct.imagen_url || normalizedProduct.image} 
                alt={normalizedProduct.nombre}
                className="w-full max-w-sm object-contain"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x400?text=Producto';
                }}
              />
            </div>

            {/* Detalles del producto */}
            <div className="space-y-6">
              {/* Marca y nombre */}
              <div>
                <p className="text-sm text-blue-600 font-semibold uppercase mb-2">{normalizedProduct.marca}</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{normalizedProduct.nombre}</h2>
                {normalizedProduct.descripcion_breve && (
                  <p className="text-gray-600 mt-2">{normalizedProduct.descripcion_breve}</p>
                )}
              </div>

              {/* Precio y stock */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-blue-600">
                  ${normalizedProduct.formattedPrice}
                </span>
                {normalizedProduct.cantidad_stock > 0 ? (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Stock disponible ({normalizedProduct.cantidad_stock} unidades)
                  </span>
                ) : (
                  <span className="text-sm text-red-600 font-medium">Agotado</span>
                )}
              </div>

              {/* Selector de color */}
              {normalizedProduct.colores_disponibles && normalizedProduct.colores_disponibles.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Colores disponibles</h3>
                  <div className="flex gap-3 flex-wrap">
                    {normalizedProduct.colores_disponibles.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className="relative group"
                      >
                        <div className={`
                          w-10 h-10 rounded-full ${colorClasses[color] || 'bg-gray-400'} 
                          ring-2 ring-offset-2 transition-all
                          ${selectedColor === color ? 'ring-blue-500 ring-offset-2' : 'ring-transparent'}
                          hover:scale-110 transition-transform
                        `} />
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {color}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedColor && (
                    <p className="text-sm text-gray-600 mt-2">
                      Color seleccionado: <span className="font-medium">{selectedColor}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Selector de cantidad */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Cantidad</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    disabled={quantity >= normalizedProduct.cantidad_stock}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botón añadir al carrito */}
              <button
                onClick={handleAddToCart}
                disabled={normalizedProduct.cantidad_stock === 0}
                className={`
                  w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                  ${normalizedProduct.cantidad_stock > 0 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 cursor-not-allowed text-gray-500'}
                `}
              >
                {addedToCart ? (
                  <>
                    <Check className="size-5" />
                    ¡Añadido al carrito!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-5" />
                    Añadir al carrito {quantity > 1 && `(${quantity} unidades)`}
                  </>
                )}
              </button>

              {/* Especificaciones técnicas */}
              {(normalizedProduct.procesador || 
                normalizedProduct.tamano_memoria_ram || 
                normalizedProduct.rom || 
                normalizedProduct.bateria || 
                normalizedProduct.dimensiones || 
                normalizedProduct.conectividad || 
                normalizedProduct.resolucion_camara_principal || 
                normalizedProduct.resolucion_camara_frontal || 
                normalizedProduct.capacidad_carga_rapida || 
                normalizedProduct.garantia_meses) && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Especificaciones técnicas</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {normalizedProduct.procesador && (
                      <div className="flex items-center gap-2">
                        <Cpu className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Procesador</p>
                          <p className="font-medium">{normalizedProduct.procesador}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.tamano_memoria_ram && (
                      <div className="flex items-center gap-2">
                        <MemoryStick className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">RAM</p>
                          <p className="font-medium">{normalizedProduct.tamano_memoria_ram}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.rom && (
                      <div className="flex items-center gap-2">
                        <HardDrive className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Almacenamiento</p>
                          <p className="font-medium">{normalizedProduct.rom}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.bateria && (
                      <div className="flex items-center gap-2">
                        <Battery className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Batería</p>
                          <p className="font-medium">{normalizedProduct.bateria}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.dimensiones && (
                      <div className="flex items-center gap-2">
                        <Ruler className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Dimensiones</p>
                          <p className="font-medium">{normalizedProduct.dimensiones}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.conectividad && (
                      <div className="flex items-center gap-2">
                        <Wifi className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Conectividad</p>
                          <p className="font-medium">{normalizedProduct.conectividad}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.resolucion_camara_principal && (
                      <div className="flex items-center gap-2">
                        <Camera className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Cámara principal</p>
                          <p className="font-medium">{normalizedProduct.resolucion_camara_principal}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.resolucion_camara_frontal && (
                      <div className="flex items-center gap-2">
                        <Camera className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Cámara frontal</p>
                          <p className="font-medium">{normalizedProduct.resolucion_camara_frontal}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.capacidad_carga_rapida && (
                      <div className="flex items-center gap-2">
                        <Zap className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Carga rápida</p>
                          <p className="font-medium">{normalizedProduct.capacidad_carga_rapida}</p>
                        </div>
                      </div>
                    )}
                    {normalizedProduct.garantia_meses && (
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-gray-500 shrink-0" />
                        <div>
                          <p className="text-gray-500">Garantía</p>
                          <p className="font-medium">{normalizedProduct.garantia_meses} meses</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}