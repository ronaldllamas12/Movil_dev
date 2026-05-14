import { beforeEach, describe, expect, it, vi } from 'vitest';

const createSpy = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: createSpy,
  },
}));

const loadClientModule = async (apiBaseUrl) => {
  vi.resetModules();
  createSpy.mockReset();
  vi.stubEnv('VITE_API_BASE_URL', apiBaseUrl ?? '');
  vi.stubEnv('VITE_BASE_URL', '');

  let capturedInterceptor;
  createSpy.mockImplementation((config) => ({
    ...config,
    interceptors: {
      request: {
        use(handler) {
          capturedInterceptor = handler;
        },
      },
    },
  }));

  const module = await import('./axiosClient');
  const createdConfig = createSpy.mock.calls.at(-1)?.[0];

  return { module, createdConfig, capturedInterceptor };
};

describe('axiosClient', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it('usa /api cuando no hay env', async () => {
    const { createdConfig } = await loadClientModule('');
    expect(createdConfig.baseURL).toBe('/api');
  });

  it('normaliza a proxy local cuando apunta al mismo origin del frontend', async () => {
    const { createdConfig } = await loadClientModule(window.location.origin);
    expect(createdConfig.baseURL).toBe('/api');
  });

  it('normaliza a proxy local cuando usa host u hostname actual', async () => {
    const hostResult = await loadClientModule(window.location.host);
    expect(hostResult.createdConfig.baseURL).toBe('/api');

    const hostnameResult = await loadClientModule(window.location.hostname);
    expect(hostnameResult.createdConfig.baseURL).toBe('/api');
  });

  it('mantiene rutas relativas absolutas iniciadas por /', async () => {
    const { createdConfig } = await loadClientModule('/api-external');
    expect(createdConfig.baseURL).toBe('/api-external');
  });

  it('normaliza host sin protocolo a https', async () => {
    const { createdConfig } = await loadClientModule('api.midominio.com');
    expect(createdConfig.baseURL).toBe('https://api.midominio.com');
  });

  it('normaliza localhost sin protocolo a http', async () => {
    const { createdConfig } = await loadClientModule('localhost:8000');
    expect(createdConfig.baseURL).toBe('http://localhost:8000');
  });

  it('inyecta token bearer en interceptor de request', async () => {
    const { capturedInterceptor } = await loadClientModule('http://localhost:8000');
    localStorage.setItem('access_token', 'abc123');

    const updated = capturedInterceptor({ headers: {} });

    expect(updated.headers.Authorization).toBe('Bearer abc123');
  });

  it('no sobreescribe Authorization existente', async () => {
    const { capturedInterceptor } = await loadClientModule('http://localhost:8000');
    localStorage.setItem('access_token', 'abc123');

    const updated = capturedInterceptor({ headers: { Authorization: 'Bearer ya-existe' } });

    expect(updated.headers.Authorization).toBe('Bearer ya-existe');
  });

  it('prioriza detail y message al normalizar error', async () => {
    const { module } = await loadClientModule('');

    expect(module.getApiErrorMessage({ response: { data: { detail: 'Detalle' } } })).toBe('Detalle');
    expect(module.getApiErrorMessage({ response: { data: { message: 'Mensaje' } } })).toBe('Mensaje');
    expect(module.getApiErrorMessage({ message: 'Error plano' })).toBe('Error plano');
    expect(module.getApiErrorMessage({})).toBe('Ocurrio un error de conexion con el servidor.');
  });
});
