import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toProductCardModel } from './api/mappers/productMapper';
import { getProducts } from './api/services/productsService';
import AdminDashboard from './components/AdminDashboard';
import Carrito from './components/Carrito';
import Catalogo from './components/Catalogo';
import Categories from './components/categories';
import ContactBanner from './components/ContactBanner';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Perfil from './components/Perfil';
import ProductCard from './components/ProductCard';
import { CarritoProvider } from './context/CarritoContext';
import { ThemeProvider } from './context/ThemeContext';

// Datos de prueba (Luego vendrán de tu backend)
const productsFallback = [
  { id: 1, marca: 'Apple', nombre: 'iPhone 15 Pro Max', precio: '1,199', oldPrice: '1,299', discount: 8, rating: 4.8, reviews: 342, image: 'https://placehold.co/400x400?text=iPhone+15+Pro+Max' },
  { id: 2, marca: 'Samsung', nombre: 'Galaxy S24 Ultra', precio: '1,099', oldPrice: '1,199', discount: 8, rating: 4.7, reviews: 287, image: 'https://placehold.co/400x400?text=Galaxy+S24+Ultra' },
  { id: 3, marca: 'Google', nombre: 'Pixel 8 Pro', precio: '899', oldPrice: '999', discount: 10, rating: 4.6, reviews: 198, image: 'https://placehold.co/400x400?text=Pixel+8+Pro' },
  { id: 4, marca: 'Xiaomi', nombre: '14 Ultra', precio: '999', oldPrice: '1,099', discount: 9, rating: 4.5, reviews: 150, image: 'https://placehold.co/400x400?text=Xiaomi+14+Ultra' },
];
function App() {
  const [products, setProducts] = useState(productsFallback);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const apiProducts = await getProducts();
        const mappedProducts = apiProducts.map(toProductCardModel).filter(Boolean);

        if (isMounted && mappedProducts.length > 0) {
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error('No se pudieron cargar productos desde API:', error);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ThemeProvider>
      <CarritoProvider>
        <div className="w-full min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] transition-colors duration-300">
          <Navbar />

        <main className="w-full bg-[color:var(--bg)]">
        <Routes>
          <Route path="/" element={
            <> 
            
              <Hero products={products} />
              <Features />
              <Categories />

                      {/* Sección Más Vendidos */}
              <section className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-bold text-[color:var(--text)]">Más Vendidos</h2>
                  <Link
                    to="/catalogo"
                    className="text-purple-600 font-bold border border-purple-600 px-4 py-2 rounded-lg hover:bg-[color:var(--surface-hover)] transition"
                  >
                    Ver todos →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>


{/* Prod      uctos Destacados (Puedes repetir la lógica o variar los productos) */}
              <section className="max-w-7xl mx-auto px-6 py-16 bg-[color:var(--surface-muted)] rounded-[3rem] my-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-bold text-[color:var(--text)]">Productos Destacados</h2>
                  <Link
                    to="/catalogo"
                    className="text-purple-600 font-bold border border-purple-600 px-4 py-2 rounded-lg hover:bg-[color:var(--surface-hover)] transition"
                  >
                    Ver todos →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
                
              <ContactBanner />
                        
            </>
          } />
          {/* RUTAS DEL CATÁLOGO: Todas llevan al mismo componente */}
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/:categoriaUrl" element={<Catalogo />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/carrito" element={<Carrito />} />
        </Routes>
      </main>

      <Footer />
    </div>
    </CarritoProvider>
    </ThemeProvider>
  );
}


export default App;