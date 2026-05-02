import { Loader2, MessageCircle, Power, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    connectWhatsApp,
    disconnectWhatsApp,
    getWhatsAppQR,
    getWhatsAppStatus,
} from '../../api/services/whatsappService';

const POLL_INTERVAL_MS = 5000; // refresca estado cada 5 s

export default function WhatsAppPanel() {
  const [status, setStatus] = useState(null); // { ready, hasQR, connecting }
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingQR, setLoadingQR] = useState(false);
  const [loadingControl, setLoadingControl] = useState(false);
  const [error, setError] = useState(null);
  const pollerRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getWhatsAppStatus();
      setStatus(data);
      setError(null);
      // Si ya está conectado, limpiamos el QR
      if (data.ready) setQrDataUrl(null);
    } catch {
      setError('No se pudo obtener el estado del servicio WhatsApp.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchQR = useCallback(async () => {
    setLoadingQR(true);
    try {
      const data = await getWhatsAppQR();
      if (data.qr) {
        setQrDataUrl(data.qr);
      } else {
        setQrDataUrl(null);
      }
    } catch {
      setError('Error obteniendo el QR.');
    } finally {
      setLoadingQR(false);
    }
  }, []);

  const handleConnect = useCallback(async () => {
    setLoadingControl(true);
    setError(null);
    try {
      const result = await connectWhatsApp();
      setStatus(prev => ({ ...prev, connecting: true }));
      // Espera un poco y luego actualiza el estado
      setTimeout(() => fetchStatus(), 2000);
    } catch (err) {
      setError('Error al conectar WhatsApp.');
    } finally {
      setLoadingControl(false);
    }
  }, [fetchStatus]);

  const handleDisconnect = useCallback(async () => {
    setLoadingControl(true);
    setError(null);
    try {
      await disconnectWhatsApp();
      setStatus(prev => ({ ...prev, ready: false, hasQR: false }));
      setQrDataUrl(null);
      fetchStatus();
    } catch (err) {
      setError('Error al desconectar WhatsApp.');
    } finally {
      setLoadingControl(false);
    }
  }, [fetchStatus]);

  // Polling automático del estado
  useEffect(() => {
    fetchStatus();
    pollerRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(pollerRef.current);
  }, [fetchStatus]);

  // Cuando el estado indica que hay QR disponible, lo cargamos automáticamente
  useEffect(() => {
    if (status?.hasQR && !qrDataUrl) {
      fetchQR();
    }
  }, [status?.hasQR, qrDataUrl, fetchQR]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-green-100 p-2 text-green-600">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">WhatsApp</h2>
            <p className="text-sm text-slate-500">
              Vincula el número para enviar notificaciones de pedidos
            </p>
          </div>
        </div>
        <button
          onClick={() => { setLoadingStatus(true); fetchStatus(); }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw className="size-4" />
          Actualizar
        </button>
      </div>

      {/* Error global */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Estado de conexión */}
      {loadingStatus ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Consultando estado...
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${
              status?.ready
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            {status?.ready ? (
              <Wifi className="size-5 text-green-600" />
            ) : (
              <WifiOff className="size-5 text-amber-500" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  status?.ready ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {status?.ready ? 'Conectado y activo' : status?.connecting ? 'Conectando...' : 'Sin conexión'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {status?.ready
                  ? 'Las notificaciones de pedidos se enviarán automáticamente.'
                  : status?.connecting
                  ? 'Iniciando conexión, escanea el QR cuando aparezca.'
                  : status?.hasQR
                  ? 'Escanea el QR desde WhatsApp en tu teléfono para vincular.'
                  : 'El microservicio no está disponible o aún está iniciando.'}
              </p>
            </div>
          </div>

          {/* Botones de control */}
          <div className="flex gap-3">
            {status?.ready ? (
              <button
                onClick={handleDisconnect}
                disabled={loadingControl}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                <Power className="size-4" />
                {loadingControl ? 'Desconectando...' : 'Desconectar'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loadingControl || status?.connecting}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition disabled:opacity-60"
              >
                <Wifi className="size-4" />
                {loadingControl || status?.connecting ? 'Conectando...' : 'Conectar'}
              </button>
            )}
            <button
              onClick={() => { setLoadingStatus(true); fetchStatus(); }}
              disabled={loadingStatus || loadingControl}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${loadingStatus ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      )}

      {/* QR */}
      {!status?.ready && (
        <div className="space-y-4">
          {loadingQR ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando QR...
            </div>
          ) : qrDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-slate-600 font-medium">
                Escanea este QR desde <strong>WhatsApp → Dispositivos vinculados → Vincular dispositivo</strong>
              </p>
              <div className="rounded-2xl border-2 border-green-200 p-3 bg-white shadow-sm">
                <img
                  src={qrDataUrl}
                  alt="QR WhatsApp"
                  className="w-60 h-60 object-contain"
                />
              </div>
              <p className="text-xs text-slate-400">
                El QR expira en ~60 segundos. Se regenerará automáticamente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-slate-500">
                El microservicio WhatsApp está iniciando o desconectado.
              </p>
              <button
                onClick={fetchQR}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition"
              >
                <RefreshCw className="size-4" />
                Obtener QR
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
