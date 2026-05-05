import axios from 'axios';

function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BASE_URL || '').trim();
  const normalized = raw.replace(/\/+$/, '');

  if (!raw) return '/api';

  // Si por error apunta al mismo origin del frontend (ej. localhost:5173),
  // usamos el proxy de Vite para llegar al backend.
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    const currentHost = window.location.host;
    const currentHostname = window.location.hostname;
    const currentPort = window.location.port;

    if (
      normalized === currentOrigin ||
      normalized === currentHost ||
      normalized === currentHostname ||
      normalized === `${currentHostname}:${window.location.port}`
    ) {
      return '/api';
    }

    // Si el env apunta a loopback con el mismo puerto del frontend,
    // también forzamos proxy local para mantener una sola "site" de cookies.
    const localLike = normalized.replace(/^https?:\/\//, '').toLowerCase();
    const isLocalFrontendHost = localLike.startsWith('localhost:') || localLike.startsWith('127.0.0.1:');
    if (isLocalFrontendHost && localLike.endsWith(`:${currentPort}`)) {
      return '/api';
    }
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('/')) {
    return normalized;
  }

  if (normalized.startsWith('localhost') || normalized.startsWith('127.0.0.1')) {
    return `http://${normalized}`;
  }

  return `https://${normalized}`;
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'Ocurrio un error de conexion con el servidor.'
  );
}

export default apiClient;
