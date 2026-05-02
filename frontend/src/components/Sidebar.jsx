import { Box, MessageCircle, Package, Settings2, ShoppingCart } from 'lucide-react';

export default function Sidebar({ selected, onSelect }) {
  return (
    <aside className="w-56 min-h-screen bg-[color:var(--surface)] border-r border-[color:var(--border)] flex flex-col py-8 px-4 gap-2 sticky top-0 transition-colors duration-300">
      <h2 className="text-lg font-bold text-[color:var(--text)] mb-6 flex items-center gap-2">
        <span className="text-[color:var(--accent)]"><Settings2 className="inline size-5" /></span>
        Admin
      </h2>
      <button
        className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] transition ${selected === 'carrito' ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]' : ''}`}
        onClick={() => onSelect('carrito')}
      >
        <ShoppingCart className="size-5" />
        Configuración Carrito
      </button>
      <button
        className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] transition ${selected === 'productos' ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]' : ''}`}
        onClick={() => onSelect('productos')}
      >
        <Box className="size-5" />
        Gestión Productos
      </button>
      <button
         className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] transition ${selected === 'pedidos' ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]' : ''}`}
        onClick={() => onSelect('pedidos')}
      >
        <Package className="size-5" />
        Gestión Pedidos
      </button>
      <button
        className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] transition ${selected === 'whatsapp' ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]' : ''}`}
        onClick={() => onSelect('whatsapp')}
      >
        <MessageCircle className="size-5" />
        WhatsApp
      </button>
    </aside>
  );
}
