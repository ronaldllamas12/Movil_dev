/**
 * Hook con efectos asíncronos: usamos renderHook + act para simular llamadas como en un componente real.
 * axiosClient.getApiErrorMessage está mockeado para no acoplar el test al formato exacto de Axios.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useAsyncAction from './useAsyncAction.js';

vi.mock('../api/axiosClient', () => ({
  getApiErrorMessage: (err) => err?.message || 'Error genérico',
}));

describe('useAsyncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('expone loading=true mientras la promesa está pendiente y luego false', async () => {
    let resolvePromise;
    const deferred = new Promise((r) => {
      resolvePromise = r;
    });

    const { result } = renderHook(() => useAsyncAction());

    act(() => {
      void result.current.run(() => deferred);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await act(async () => {
      resolvePromise(42);
      await deferred;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devuelve el valor resuelto de la función async', async () => {
    const { result } = renderHook(() => useAsyncAction());

    let value;
    await act(async () => {
      value = await result.current.run(async () => 'ok');
    });

    expect(value).toBe('ok');
    expect(result.current.error).toBe('');
  });

  it('guarda mensaje de error y re-lanza cuando la acción falla', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await expect(
        result.current.run(async () => {
          throw new Error('falló red');
        }),
      ).rejects.toThrow('falló red');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('falló red');
      expect(result.current.loading).toBe(false);
    });
  });

  it('clearError limpia el string de error', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      try {
        await result.current.run(async () => {
          throw new Error('x');
        });
      } catch {
        /* esperado */
      }
    });

    await waitFor(() => expect(result.current.error).toBe('x'));

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe('');
  });
});
