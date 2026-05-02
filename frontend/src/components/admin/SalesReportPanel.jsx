import {
  BarChart3,
  DollarSign,
  Loader2,
  PackageOpen,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSalesReport } from '../../api/services/salesReportService';

const STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  processing: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  shipped: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  refunded: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function SalesReportPanel() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSalesReport();
      setReport(data);
    } catch (err) {
      setError('Error al cargar el reporte de ventas. Intenta nuevamente.');
      console.error('Error loading sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 flex items-center gap-3">
        <Loader2 className="size-5 animate-spin" />
        Cargando reporte de ventas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-rose-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-700">{error}</p>
            <button
              onClick={loadReport}
              className="mt-3 px-4 py-2 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition flex items-center gap-2"
            >
              <RefreshCw className="size-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="size-6 text-emerald-700" />
            <div>
              <h2 className="text-lg font-bold text-emerald-900">Reporte de Ventas</h2>
              <p className="text-sm text-emerald-700">Resumen de rendimiento y métricas clave</p>
            </div>
          </div>
          <button
            onClick={loadReport}
            className="p-2 rounded-lg hover:bg-white/50 transition"
            title="Actualizar reporte"
          >
            <RefreshCw className="size-5 text-emerald-700" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${Number(report.total_revenue).toLocaleString('es-CO')}
              </p>
            </div>
            <DollarSign className="size-8 text-emerald-500" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total de Órdenes</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {report.total_orders}
              </p>
            </div>
            <ShoppingCart className="size-8 text-blue-500" />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Valor Promedio</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${Number(report.average_order_value).toLocaleString('es-CO')}
              </p>
            </div>
            <TrendingUp className="size-8 text-indigo-500" />
          </div>
        </div>

        {/* Total Refunded */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Reembolsado</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${Number(report.total_refunded).toLocaleString('es-CO')}
              </p>
            </div>
            <PackageOpen className="size-8 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Estado de Órdenes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(report.status_breakdown).map(([status, count]) => (
            <div
              key={status}
              className={`rounded-lg border p-4 ${STATUS_COLORS[status]}`}
            >
              <p className="text-sm font-medium">{STATUS_LABELS[status]}</p>
              <p className="text-2xl font-bold mt-2">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Últimas Órdenes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ID Orden</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {report.recent_orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-900">#{order.id}</td>
                  <td className="px-4 py-3 text-slate-700">{order.customer_name}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">
                    ${Number(order.total).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(order.created_at).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
