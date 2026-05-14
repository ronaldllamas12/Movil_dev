/**
 * Pruebas unitarias de getApiErrorMessage: función pura respecto al objeto error que le pasas.
 * No hacemos fetch real; solo verificamos la prioridad de campos (detail → message → Error.message → fallback).
 */
import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './axiosClient.js';

describe('getApiErrorMessage', () => {
  it('prioriza detail del cuerpo de respuesta', () => {
    expect(
      getApiErrorMessage({
        response: { data: { detail: 'Token inválido' } },
      }),
    ).toBe('Token inválido');
  });

  it('usa message si no hay detail', () => {
    expect(
      getApiErrorMessage({
        response: { data: { message: 'No autorizado' } },
      }),
    ).toBe('No autorizado');
  });

  it('cae al mensaje del Error de JS si no hay response', () => {
    expect(getApiErrorMessage(new Error('Network down'))).toBe('Network down');
  });

  it('devuelve texto por defecto si no hay información útil', () => {
    expect(getApiErrorMessage({})).toBe('Ocurrio un error de conexion con el servidor.');
  });
});
