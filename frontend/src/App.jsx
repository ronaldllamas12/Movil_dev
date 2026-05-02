import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { toProductCardModel } from './api/mappers/productMapper';
import { getProducts } from './api/services/productsService';
import AdminDashboard from './components/AdminDashboard';
import Cancel from './components/Cancel';
import Carrito from './components/Carrito';
import Catalogo from './components/Catalogo';
import Categories from './components/categories';
import CheckoutSteps from './components/CheckoutSteps';
import ContactBanner from './components/ContactBanner';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Perfil from './components/Perfil';
import ProductCard from './components/ProductCard';
import Success from './components/Success';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Datos de prueba (Luego vendrán de tu backend)
const productsFallback = [
  { id: 1, marca: 'Apple', nombre: 'iPhone 15 Pro Max', precio: '1,199', oldPrice: '1,299', discount: 8, rating: 4.8, reviews: 342, image: 'https://placehold.co/400x400?text=iPhone+15+Pro+Max' },
  { id: 2, marca: 'Samsung', nombre: 'Galaxy S24 Ultra', precio: '1,099', oldPrice: '1,199', discount: 8, rating: 4.7, reviews: 287, image: 'https://placehold.co/400x400?text=Galaxy+S24+Ultra' },
  { id: 3, marca: 'Google', nombre: 'Pixel 8 Pro', precio: '899', oldPrice: '999', discount: 10, rating: 4.6, reviews: 198, image: 'https://placehold.co/400x400?text=Pixel+8+Pro' },
  { id: 4, marca: 'Xiaomi', nombre: '14 Ultra', precio: '999', oldPrice: '1,099', discount: 9, rating: 4.5, reviews: 150, image: 'https://placehold.co/400x400?text=Xiaomi+14+Ultra' },
];

import { useCarrito } from './context/CarritoContext';


// Componente del botón flotante de WhatsApp
const WhatsAppButton = () => {
  const phoneNumber = "3165361880"; // 
  const message = "Hola, me gustaría obtener más información sobre sus productos.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
      aria-label="Chat de WhatsApp"
    >
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 24 24" 
  fill="currentColor" 
  className="w-6 h-6"
>
  <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2c-5.523 0-10 4.477-10 10 0 1.842.5 3.649 1.449 5.278l-1.443 5.27 5.386-1.412c1.543.842 3.271 1.285 5.033 1.285 5.523 0 10-4.477 10-10 0-2.677-1.041-5.185-2.928-7.072l-.426-.426zM12.006 20.5c-1.513 0-3.015-.409-4.328-1.182l-.311-.184-3.194.838.857-3.117-.2-.326c-.873-1.424-1.333-3.036-1.333-4.663 0-4.686 3.813-8.5 8.5-8.5 2.27 0 4.404.884 6.01 2.49s2.49 3.74 2.49 6.01c0 4.686-3.813 8.5-8.5 8.5z"/>
  <path d="M16.38 13.677c-.239-.119-1.412-.696-1.63-.776-.218-.079-.377-.119-.535.119-.159.239-.616.776-.755.935-.139.159-.278.179-.517.06-.239-.119-1.008-.372-1.92-1.185-.709-.631-1.188-1.411-1.327-1.65-.139-.239-.015-.368.104-.488.107-.107.239-.278.358-.417.119-.139.159-.239.239-.398.079-.159.04-.298-.02-.417-.06-.119-.535-1.291-.733-1.768-.192-.463-.388-.4-.535-.408-.139-.006-.298-.006-.457-.006-.159 0-.417.06-.635.298-.218.239-.834.814-.834 1.984 0 1.171.853 2.303.972 2.462.119.159 1.678 2.562 4.066 3.592.568.245 1.011.391 1.357.5.57.182 1.089.156 1.499.095.457-.068 1.412-.577 1.611-1.135.199-.557.199-1.035.139-1.135-.06-.099-.219-.159-.458-.278z"/>
</svg>
    </a>
  );
}






function App() {
  const [products, setProducts] = useState(productsFallback);
  const { currentUser } = useCarrito();

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const apiProducts = await getProducts();
        if (!Array.isArray(apiProducts)) {
          console.warn('Respuesta de /products no es un arreglo. Se omite el mapeo.', apiProducts);
          return;
        }

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
          <Route path="/checkout-steps" element={<CheckoutSteps currentUser={currentUser} />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
        </Routes>
      </main>

      <Footer />
      {/* boton flotante de WhatsApp */}
      <WhatsAppButton />
    </div>
    </ThemeProvider>
  );
}


export default App;
