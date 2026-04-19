import { useEffect, useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom'; // Importamos hooks de ruta
import { getProducts } from '../api/services/productsService';
import { toProductCardModel } from '../api/mappers/productMapper';
import ProductCard from './ProductCard';

const categorias = ['Todas', 'Premium', 'Gama Media', 'Economicos'];
const marcas = ['Apple', 'Google', 'Motorola', 'Nothing', 'OPPO', 'OnePlus', 'Realme', 'Samsung', 'Xiaomi'];

function slugToCategory(slug) {
  const normalized = String(slug).toLowerCase();
  if (normalized === 'premium') return 'Premium';
  if (normalized === 'gama-media') return 'Gama Media';
  if (normalized === 'economicos') return 'Economicos';
  return null;
}

function categoryToApiValue(category) {
  const normalized = category.toLowerCase();
  if (normalized === 'premium') return 'premium';
  if (normalized === 'gama media') return 'gama media';
  if (normalized === 'economicos') return 'economico';
  return normalized;
}

export default function Catalogo() {
  // 1. Extraemos la categoría de la URL (ej: /catalogo/premium)
  const { categoriaUrl } = useParams(); 
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Mapeamos el nombre de la URL al nombre visual
  const categoriaSel = categoriaUrl 
    ? slugToCategory(categoriaUrl) || 'Todas'
    : 'Todas';

  // 2. Título Dinámico
  const tituloPagina = categoriaSel === 'Todas' 
    ? 'Catálogo de Celulares' 
    : `Celulares ${categoriaSel}`;

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setSearchText('');
      setSelectedBrands([]);

      try {
        const params = categoriaSel === 'Todas'
          ? {}
          : { categoria: categoryToApiValue(categoriaSel) };

        const apiProducts = await getProducts(params);
        const mappedProducts = apiProducts.map(toProductCardModel);

        if (isMounted) {
          setProducts(mappedProducts);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('No se pudieron cargar los productos. Intenta recargar.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categoriaSel]);

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const toggleBrand = (brand) => {
    setSelectedBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand],
    );
  };

  const filteredProducts = products.filter((product) => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === '' ||
      product.nombre.toLowerCase().includes(normalizedSearch) ||
      product.marca.toLowerCase().includes(normalizedSearch);

    const matchesBrand =
      selectedBrands.length === 0 ||
      selectedBrands.includes(product.marca);

    return matchesSearch && matchesBrand;
  });

  // 3. Función para navegar al filtrar
  const manejarFiltro = (cat) => {
    if (cat === 'Todas') {
      navigate('/catalogo');
    } else {
      const slug = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
      navigate(`/catalogo/${slug}`);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10">
      {/* Encabezado Dinámico */}
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 transition-all">
          {tituloPagina}
        </h1>
        <p className="text-gray-500">{filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'} disponible{filteredProducts.length === 1 ? '' : 's'}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR DE FILTROS */}
        <aside className="w-full lg:w-64 space-y-6 bg-white p-6 rounded-2xl border border-gray-100 lg:sticky lg:top-24 h-fit">
          <div className="flex items-center gap-2 border-b pb-4">
            <Filter className="size-5 text-purple-600" />
            <h2 className="font-bold text-lg">Filtros</h2>
          </div>

          <div>
            <h3 className="font-bold text-slate-700 mb-4">Categoría</h3>
            <div className="flex flex-col gap-2">
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => manejarFiltro(cat)} // Ahora navega en lugar de solo cambiar estado
                  className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition ${
                    categoriaSel === cat 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'bg-gray-50 text-slate-600 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Marca (Se mantiene igual) */}
          <div>
            <h3 className="font-bold text-slate-700 mb-4">Marca</h3>
            <div className="space-y-3">
              {marcas.map(marca => (
                <label key={marca} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(marca)}
                    onChange={() => toggleBrand(marca)}
                    className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-purple-600 transition">{marca}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="w-full lg:flex-1-1">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="relative w-full sm:max-w-xs">
              <input 
                type="text" 
                value={searchText}
                onChange={handleSearchChange}
                placeholder={`Buscar en ${categoriaSel.toLowerCase()}...`} 
                className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Destacados <ChevronDown className="size-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full rounded-3xl bg-white border border-gray-100 p-12 text-center text-slate-500">
                Cargando productos...
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="col-span-full rounded-3xl bg-white border border-gray-100 p-12 text-center text-slate-500">
                No se encontraron productos para esta categoría.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}