import {
    ArrowRight,
    CheckCircle2,
    Circle,
    Clock3,
    CreditCard,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Package,
    RotateCcw,
    Truck,
    Undo2,
    User2,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
    downloadOrderInvoice,
    getAllOrders,
    refundOrder,
    sendOrderInvoice,
    updateOrderStatus,
} from '../../api/services/ordersService';

const ORDER_STATUS_META = {
  pending: { label: 'Pendiente', badge: 'bg-amber-100 text-amber-800 border border-amber-200' },
  paid: { label: 'Pagado', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  processing: { label: 'En preparacion', badge: 'bg-cyan-100 text-cyan-800 border border-cyan-200' },
  shipped: { label: 'Enviado', badge: 'bg-blue-100 text-blue-800 border border-blue-200' },
  delivered: { label: 'Entregado', badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
  cancelled: { label: 'Cancelado', badge: 'bg-rose-100 text-rose-800 border border-rose-200' },
  refunded: { label: 'Reembolsado', badge: 'bg-violet-100 text-violet-800 border border-violet-200' },
};

const ORDER_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

const STATUS_CHAIN = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const REFUND_BASE_DRAFT = { refund_type: 'partial', amount: '', reason: '' };
const REFUNDABLE_STATUSES = new Set(['paid', 'processing', 'shipped', 'delivered']);

function getChainStepState(stepStatus, orderStatus) {
  const stepIdx = STATUS_CHAIN.indexOf(stepStatus);
  const curIdx = STATUS_CHAIN.indexOf(orderStatus);
  if (stepIdx < curIdx) return 'done';
  if (stepIdx === curIdx) return 'current';
  return 'upcoming';
}

function getStatusLabel(status) {
  return ORDER_STATUS_META[status]?.label || status;
}

function getStatusBadgeClass(status) {
  return ORDER_STATUS_META[status]?.badge || 'bg-slate-100 text-slate-700 border border-slate-200';
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatDateTime(value) {
  if (!value) {
    return 'Sin fecha';
  }
  return new Date(value).toLocaleString('es-CO');
}

function toReadableStatus(status) {
  return getStatusLabel(status);
}

function toReadableTransition(fromStatus, toStatus) {
  if (!fromStatus) {
    return `Creacion -> ${toReadableStatus(toStatus)}`;
  }
  return `${toReadableStatus(fromStatus)} -> ${toReadableStatus(toStatus)}`;
}

function toRefundTotal(order) {
  if (!Array.isArray(order?.refunds)) {
    return 0;
  }
  return order.refunds.reduce((acc, item) => acc + Number(item.amount || 0), 0);
}

function toRefundRemaining(order) {
  return Math.max(Number(order?.total || 0) - toRefundTotal(order), 0);
}

function canRefundOrder(order) {
  return REFUNDABLE_STATUSES.has(order?.status) && toRefundRemaining(order) > 0;
}

function toOrderDisplayUser(order) {
  return order?.user_full_name || order?.customer_name || `#${order.user_id}`;
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderReasonDrafts, setOrderReasonDrafts] = useState({});
  const [refundDrafts, setRefundDrafts] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      setOrdersLoading(true);
      setErrorMsg('');

      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (error) {
        setErrorMsg(error?.response?.data?.detail || 'No se pudieron cargar las ordenes.');
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, []);

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOrderReasonChange = (orderId, value) => {
    setOrderReasonDrafts((prev) => ({ ...prev, [orderId]: value }));
  };

  const getRefundDraft = (orderId) => refundDrafts[orderId] || REFUND_BASE_DRAFT;

  const handleRefundDraftChange = (orderId, field, value) => {
    setRefundDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...getRefundDraft(orderId),
        [field]: value,
      },
    }));
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    resetMessages();
    setIsSaving(true);

    try {
      const reason = (orderReasonDrafts[orderId] || '').trim();
      const updatedOrder = await updateOrderStatus(orderId, newStatus, reason);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
      setOrderReasonDrafts((prev) => ({ ...prev, [orderId]: '' }));
      setSuccessMsg(`Estado actualizado a ${getStatusLabel(newStatus)}.`);
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo actualizar el estado de la orden.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRefund = async (order) => {
    if (!REFUNDABLE_STATUSES.has(order?.status)) {
      setErrorMsg(`La orden esta en estado '${getStatusLabel(order?.status)}' y no permite reembolsos.`);
      return;
    }

    if (toRefundRemaining(order) <= 0) {
      setErrorMsg('La orden ya fue reembolsada completamente.');
      return;
    }

    resetMessages();
    setIsSaving(true);

    try {
      const draft = getRefundDraft(order.id);
      const payload = {
        refund_type: draft.refund_type,
        reason: (draft.reason || '').trim() || null,
      };

      if (draft.refund_type === 'partial') {
        payload.amount = Number(draft.amount || 0);
      }

      const updatedOrder = await refundOrder(order.id, payload);
      setOrders((prev) => prev.map((item) => (item.id === order.id ? updatedOrder : item)));
      setRefundDrafts((prev) => ({ ...prev, [order.id]: REFUND_BASE_DRAFT }));
      setSuccessMsg('Reembolso registrado correctamente.');
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo registrar el reembolso.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOrderDetails = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleDownloadInvoice = async (orderId) => {
    resetMessages();
    try {
      await downloadOrderInvoice(orderId);
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo abrir la factura PDF.');
    }
  };

  const handleSendInvoice = async (orderId) => {
    resetMessages();
    setIsSaving(true);

    try {
      const updatedOrder = await sendOrderInvoice(orderId);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
      setSuccessMsg(`Factura enviada a ${updatedOrder.invoice_email_sent_to || updatedOrder.customer_email}.`);
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo enviar la factura. Revisa Mailtrap y el correo del cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {errorMsg ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}
      {successMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Pedidos ({orders.length})</h2>
        </div>

        {ordersLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="size-5 animate-spin mx-auto mb-2" />
            Cargando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-500">No hay pedidos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Subtotal</th>
                  <th className="text-left px-4 py-3">Impuestos</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const nextStatuses = ORDER_TRANSITIONS[order.status] || [];
                  const draft = getRefundDraft(order.id);
                  const refundedTotal = toRefundTotal(order);
                  const refundRemaining = toRefundRemaining(order);

                  return (
                    <React.Fragment key={`order-group-${order.id}`}>
                      <tr key={`order-${order.id}`} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-3 text-slate-500">#{order.id}</td>
                        <td className="px-4 py-3 text-slate-700">{toOrderDisplayUser(order)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateTime(order.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatCurrency(order.subtotal)}</td>
                        <td className="px-4 py-3">{formatCurrency(order.tax)}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleToggleOrderDetails(order.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                              >
                                {expandedOrderId === order.id ? 'Ocultar detalles' : 'Ver detalles'}
                              </button>

                              {nextStatuses.map((nextStatus) => (
                                <button
                                  key={`${order.id}-${nextStatus}`}
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleUpdateOrderStatus(order.id, nextStatus)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                                >
                                  {nextStatus === 'processing' ? <Clock3 className="size-3" /> : null}
                                  {nextStatus === 'shipped' ? <Truck className="size-3" /> : null}
                                  {nextStatus === 'refunded' ? <RotateCcw className="size-3" /> : null}
                                  A {getStatusLabel(nextStatus)}
                                </button>
                              ))}

                              {order.status === 'paid' ? (
                                <button
                                  type="button"
                                  disabled={isSaving || !order.customer_email}
                                  onClick={() => handleSendInvoice(order.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                >
                                  <Mail className="size-3" />
                                  Enviar factura
                                </button>
                              ) : null}

                              {order.invoice_pdf_path ? (
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleDownloadInvoice(order.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                >
                                  <FileText className="size-3" />
                                  Factura
                                </button>
                              ) : null}
                            </div>

                            {nextStatuses.length > 0 ? (
                              <input
                                type="text"
                                value={orderReasonDrafts[order.id] || ''}
                                onChange={(event) => handleOrderReasonChange(order.id, event.target.value)}
                                placeholder="Motivo (opcional) para transicion de estado"
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>

                      {expandedOrderId === order.id ? (
                        <tr key={`details-${order.id}`} className="bg-gradient-to-b from-slate-50 to-white">
                          <td colSpan={8} className="px-4 py-6">
                            <div className="space-y-5">
                              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Progreso del pedido</p>
                                {order.status === 'cancelled' || order.status === 'refunded' ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {STATUS_CHAIN.map((s, i) => (
                                      <React.Fragment key={s}>
                                        <div className="flex flex-col items-center gap-1 min-w-[52px]">
                                          <span className="size-8 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
                                            <Circle className="size-3.5 text-slate-400" />
                                          </span>
                                          <span className="text-xs text-slate-400 text-center leading-tight">{getStatusLabel(s)}</span>
                                        </div>
                                        {i < STATUS_CHAIN.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 min-w-3" />}
                                      </React.Fragment>
                                    ))}
                                    <ArrowRight className="size-4 text-slate-400 mx-1 flex-shrink-0" />
                                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                      <span className={`size-8 rounded-full flex items-center justify-center border-2 ${order.status === 'cancelled' ? 'bg-rose-100 border-rose-400' : 'bg-violet-100 border-violet-400'}`}>
                                        <XCircle className={`size-3.5 ${order.status === 'cancelled' ? 'text-rose-600' : 'text-violet-600'}`} />
                                      </span>
                                      <span className={`text-xs font-bold text-center leading-tight ${order.status === 'cancelled' ? 'text-rose-600' : 'text-violet-600'}`}>{getStatusLabel(order.status)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {STATUS_CHAIN.map((s, i) => {
                                      const stepState = getChainStepState(s, order.status);
                                      return (
                                        <React.Fragment key={s}>
                                          <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                            <span className={`size-9 rounded-full flex items-center justify-center border-2 transition-all ${stepState === 'done' ? 'bg-emerald-100 border-emerald-400' : stepState === 'current' ? 'bg-indigo-100 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-amber-50 border-amber-300 border-dashed'}`}>
                                              {stepState === 'done' && <CheckCircle2 className="size-4 text-emerald-600" />}
                                              {stepState === 'current' && <div className="size-3 rounded-full bg-indigo-500" />}
                                              {stepState === 'upcoming' && <Clock3 className="size-3.5 text-amber-500" />}
                                            </span>
                                            <span className={`text-xs text-center leading-tight ${stepState === 'done' ? 'text-emerald-700 font-semibold' : stepState === 'current' ? 'text-indigo-700 font-bold' : 'text-amber-600'}`}>{getStatusLabel(s)}</span>
                                          </div>
                                          {i < STATUS_CHAIN.length - 1 && (
                                            <div className={`flex-1 h-0.5 min-w-3 transition-all ${STATUS_CHAIN.indexOf(order.status) > i ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3 flex items-center gap-3">
                                  <FileText className="size-4 text-blue-300 flex-shrink-0" />
                                  <h3 className="font-bold text-white text-sm tracking-wide">Datos de factura</h3>
                                  <span className="ml-auto text-xs text-slate-400 font-mono bg-slate-900/40 rounded px-2 py-0.5">Pedido #{order.id}</span>
                                </div>
                                <div className="bg-white p-5">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="rounded-xl border border-slate-100 border-l-4 border-l-indigo-400 bg-slate-50/60 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <User2 className="size-3.5 text-indigo-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</p>
                                      </div>
                                      <p className="text-slate-900 font-semibold">{order.customer_name || order.user_full_name || 'No registrado'}</p>
                                      <p className="text-slate-600 text-sm break-all mt-0.5">{order.customer_email || 'Sin correo'}</p>
                                      {order.customer_phone ? <p className="text-slate-500 text-sm mt-0.5">{order.customer_phone}</p> : null}
                                    </div>

                                    <div className="rounded-xl border border-slate-100 border-l-4 border-l-emerald-400 bg-slate-50/60 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="size-3.5 text-emerald-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entrega</p>
                                      </div>
                                      <p className="text-slate-900 font-semibold">{order.delivery_address || 'No registrada'}</p>
                                      {order.delivery_city ? <p className="text-slate-600 text-sm mt-0.5">{order.delivery_city}</p> : null}
                                    </div>

                                    <div className="rounded-xl border border-slate-100 border-l-4 border-l-blue-400 bg-slate-50/60 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="size-3.5 text-blue-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pago</p>
                                      </div>
                                      <p className="text-slate-900 font-semibold">{order.payment_provider || 'No registrado'}</p>
                                      <p className="text-slate-600 text-sm mt-0.5">{order.payment_method || ''}</p>
                                      {order.paid_at ? <p className="text-xs text-emerald-600 font-semibold mt-1.5">Pagado {formatDateTime(order.paid_at)}</p> : null}
                                    </div>

                                    <div className="rounded-xl border border-slate-100 border-l-4 border-l-amber-400 bg-slate-50/60 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileText className="size-3.5 text-amber-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Factura PDF</p>
                                      </div>
                                      <p className={`font-semibold text-sm ${order.invoice_pdf_path ? 'text-emerald-700' : 'text-slate-500'}`}>{order.invoice_pdf_path ? 'Generada' : 'No generada'}</p>
                                      {order.invoice_pdf_path ? (
                                        <button type="button" onClick={() => handleDownloadInvoice(order.id)} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                                          <FileText className="size-3" />
                                          Ver PDF
                                        </button>
                                      ) : null}
                                    </div>

                                    <div className="rounded-xl border border-slate-100 border-l-4 border-l-violet-400 bg-slate-50/60 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Mail className="size-3.5 text-violet-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Envio por correo</p>
                                      </div>
                                      <p className="text-slate-900 font-semibold break-all text-sm">{order.invoice_email_sent_to || 'Pendiente'}</p>
                                      <p className="text-slate-500 text-xs mt-0.5">{order.invoice_email_sent_at ? formatDateTime(order.invoice_email_sent_at) : 'Sin fecha de envio'}</p>
                                      {order.status === 'paid' ? (
                                        <button type="button" disabled={isSaving || !order.customer_email} onClick={() => handleSendInvoice(order.id)} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-60">
                                          <Mail className="size-3" />
                                          Enviar factura
                                        </button>
                                      ) : null}
                                    </div>

                                    <div className="rounded-xl border border-slate-100 border-l-4 border-l-rose-400 bg-slate-50/60 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Package className="size-3.5 text-rose-500" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumen financiero</p>
                                      </div>
                                      <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between text-slate-600">
                                          <span>Subtotal</span>
                                          <span className="font-medium text-slate-800">{formatCurrency(order.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                          <span>IVA</span>
                                          <span className="font-medium text-slate-800">{formatCurrency(order.tax)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                                          <span className="font-bold text-slate-700">Total</span>
                                          <span className="font-bold text-indigo-700">{formatCurrency(order.total)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                                  <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-5 py-3 flex items-center gap-2">
                                    <Clock3 className="size-4 text-indigo-200" />
                                    <h3 className="font-bold text-white text-sm">Historial de estados</h3>
                                    <span className="ml-auto text-xs text-indigo-300 bg-indigo-900/30 rounded px-2 py-0.5">{order.status_history?.length || 0} eventos</span>
                                  </div>
                                  <div className="bg-white p-4">
                                    {order.status_history?.length ? (
                                      <div>
                                        {[...order.status_history]
                                          .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at))
                                          .map((entry, idx, arr) => (
                                            <div key={entry.id} className="flex gap-3">
                                              <div className="flex flex-col items-center">
                                                <div className="size-7 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                </div>
                                                {idx < arr.length - 1 && <div className="w-px flex-1 bg-emerald-200 my-1 min-h-4" />}
                                              </div>
                                              <div className={`flex-1 ${idx < arr.length - 1 ? 'pb-4' : 'pb-1'}`}>
                                                <p className="text-sm font-semibold text-slate-800">{toReadableTransition(entry.from_status, entry.to_status)}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(entry.changed_at)} · {entry.actor_user_id ? `Admin #${entry.actor_user_id}` : 'Sistema'}</p>
                                                {entry.reason ? <p className="text-xs text-slate-600 mt-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">Motivo: {entry.reason}</p> : null}
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500 py-2">Sin historial disponible.</p>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                                  <div className="bg-gradient-to-r from-violet-700 to-violet-600 px-5 py-3 flex items-center gap-2">
                                    <RotateCcw className="size-4 text-violet-200" />
                                    <h3 className="font-bold text-white text-sm">Reembolsos</h3>
                                    <span className="ml-auto text-xs text-violet-300 bg-violet-900/30 rounded px-2 py-0.5">{order.refunds?.length || 0} registros</span>
                                  </div>
                                  <div className="bg-white p-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Total orden</p>
                                        <p className="font-bold text-slate-800 text-sm">{formatCurrency(order.total)}</p>
                                      </div>
                                      <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-center">
                                        <p className="text-xs text-rose-500 mb-1">Reembolsado</p>
                                        <p className="font-bold text-rose-700 text-sm">{formatCurrency(refundedTotal)}</p>
                                      </div>
                                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                                        <p className="text-xs text-emerald-600 mb-1">Disponible</p>
                                        <p className="font-bold text-emerald-700 text-sm">{formatCurrency(refundRemaining)}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      {(order.refunds || []).length === 0 ? (
                                        <p className="text-sm text-slate-500">Sin reembolsos registrados.</p>
                                      ) : (
                                        order.refunds.map((item) => (
                                          <div key={item.id} className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-semibold text-violet-800">{item.refund_type === 'total' ? 'Reembolso total' : 'Reembolso parcial'}</span>
                                              <span className="text-sm font-bold text-violet-900">{formatCurrency(item.amount)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{formatDateTime(item.created_at)} · {item.actor_user_id ? `Admin #${item.actor_user_id}` : 'Sistema'}</p>
                                            {item.reason ? <p className="text-xs text-slate-600 mt-1">Motivo: {item.reason}</p> : null}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Registrar reembolso</p>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <select value={draft.refund_type} onChange={(event) => handleRefundDraftChange(order.id, 'refund_type', event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white">
                                          <option value="partial">Parcial</option>
                                          <option value="total">Total</option>
                                        </select>
                                        <input type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => handleRefundDraftChange(order.id, 'amount', event.target.value)} placeholder="Monto" disabled={draft.refund_type === 'total'} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                                        <button type="button" disabled={isSaving || !canRefundOrder(order)} onClick={() => handleSubmitRefund(order)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-violet-600 px-2 py-1.5 text-white hover:bg-violet-500 disabled:opacity-60 text-xs font-semibold">
                                          <Undo2 className="size-3" />
                                          Reembolsar
                                        </button>
                                      </div>
                                      {REFUNDABLE_STATUSES.has(order.status) ? null : (
                                        <p className="text-[11px] text-slate-500">No se puede reembolsar en estado {getStatusLabel(order.status)}.</p>
                                      )}
                                      <textarea value={draft.reason} onChange={(event) => handleRefundDraftChange(order.id, 'reason', event.target.value)} placeholder="Motivo del reembolso (opcional)" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs min-h-16 bg-white" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {order.status === 'cancelled' ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="size-4 text-rose-600" />
                                    <p className="font-bold text-rose-800">Cancelacion registrada</p>
                                  </div>
                                  <p className="text-rose-700 text-sm">Fecha: {order.cancelled_at ? formatDateTime(order.cancelled_at) : 'Sin fecha'}</p>
                                  <p className="text-rose-700 text-sm">Motivo: {order.cancellation_reason || 'Sin motivo registrado'}</p>
                                </div>
                              ) : null}

                              <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                                <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-3 flex items-center gap-2">
                                  <Package className="size-4 text-slate-300" />
                                  <h3 className="font-bold text-white text-sm">Items del pedido</h3>
                                  <span className="ml-auto text-xs text-slate-400 bg-slate-900/30 rounded px-2 py-0.5">{order.items?.length || 0} productos</span>
                                </div>
                                {order.items?.length ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                      <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                          <th className="text-left px-4 py-3">Producto ID</th>
                                          <th className="text-left px-4 py-3">Cantidad</th>
                                          <th className="text-left px-4 py-3">Precio unitario</th>
                                          <th className="text-left px-4 py-3">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.items.map((item) => (
                                          <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 text-indigo-700 font-medium">#{item.product_id}</td>
                                            <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                                            <td className="px-4 py-3 text-slate-700">{formatCurrency(item.price)}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency((item.price || 0) * item.quantity)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="px-5 py-4 text-sm text-slate-500">No hay items registrados para esta orden.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
