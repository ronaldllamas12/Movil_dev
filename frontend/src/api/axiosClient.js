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

    if (
      normalized === currentOrigin ||
      normalized === currentHost ||
      normalized === currentHostname ||
      normalized === `${currentHostname}:${window.location.port}`
    ) {
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
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
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
