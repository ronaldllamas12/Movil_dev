import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../api/axiosClient', () => ({
  getApiErrorMessage: vi.fn(() => 'Error controlado'),
}));

import { getApiErrorMessage } from '../api/axiosClient';
import useAsyncAction from './useAsyncAction';

describe('useAsyncAction', () => {
  it('ejecuta accion async y actualiza loading', async () => {
    const { result } = renderHook(() => useAsyncAction());

    let resolved;
    await act(async () => {
      resolved = await result.current.run(async () => 'ok');
    });

    expect(resolved).toBe('ok');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('propaga error y guarda mensaje normalizado', async () => {
    const { result } = renderHook(() => useAsyncAction());
    const error = new Error('fallo original');

    await act(async () => {
      await expect(
        result.current.run(async () => {
          throw error;
        }),
      ).rejects.toThrow('fallo original');
    });

    expect(getApiErrorMessage).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe('Error controlado');
  });

  it('clearError limpia el estado de error', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await expect(
        result.current.run(async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow();
    });

    act(() => result.current.clearError());

    expect(result.current.error).toBe('');
  });

  it('captura error cuando run recibe una accion invalida', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await expect(result.current.run(undefined)).rejects.toBeInstanceOf(TypeError);
    });

    expect(getApiErrorMessage).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
