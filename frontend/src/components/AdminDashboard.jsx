import { Loader2, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import CartSettingsPanel from './admin/CartSettingsPanel';
import OrdersPanel from './admin/OrdersPanel';
import ProductsPanel from './admin/ProductsPanel';
import SalesReportPanel from './admin/SalesReportPanel';
import WhatsAppPanel from './admin/WhatsAppPanel';
import Sidebar from './Sidebar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading, currentUser } = useCarrito();
  const [selectedModule, setSelectedModule] = useState('carrito');

  const isAdmin = currentUser?.role === 'administrador';

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate('/perfil', { replace: true });
    }
  }, [isAdmin, isAuthLoading, isLoggedIn, navigate]);

  if (isAuthLoading) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 flex items-center gap-3">
          <Loader2 className="size-5 animate-spin" />
          Cargando dashboard de administrador...
        </div>
      </section>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="flex max-w-7xl mx-auto px-2 py-10 gap-6">
      <Sidebar selected={selectedModule} onSelect={setSelectedModule} />
      <main className="flex-1 space-y-6">
        <header className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-cyan-50 p-6">
          <div className="flex items-center gap-3 text-indigo-700 mb-2">
            <Shield className="size-5" />
            <p className="font-semibold">Panel de administracion</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard de administracion MOVIL-DEV</h1>
          <p className="text-slate-600 mt-1">Gestiona inventario, estado, IVA del carrito y descuentos por referencia.</p>
        </header>

        {selectedModule === 'carrito' ? <CartSettingsPanel /> : null}
        {selectedModule === 'productos' ? <ProductsPanel /> : null}
        {selectedModule === 'pedidos' ? <OrdersPanel /> : null}
        {selectedModule === 'whatsapp' ? <WhatsAppPanel /> : null}
        {selectedModule === 'reportes' ? <SalesReportPanel /> : null}
      </main>
    </div>
  );
}
