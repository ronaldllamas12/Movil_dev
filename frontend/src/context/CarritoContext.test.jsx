/**
 * Comportamiento del carrito en modo invitado (sin access_token).
 *
 * CarritoProvider hidrata sesión en useEffect; sin token no llama al backend
 * y agregarAlCarrito escribe en localStorage + estado React.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { CarritoProvider, useCarrito } from './CarritoContext.jsx';

const GUEST_CART_KEY = 'movil_dev_guest_cart_v1';

describe('CarritoContext invitado', () => {
  function wrapper({ children }) {
    return <CarritoProvider>{children}</CarritoProvider>;
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('tras hidratar, agregarAlCarrito guarda ítem y actualiza itemCount', async () => {
    const { result } = renderHook(() => useCarrito(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthLoading).toBe(false);
    });
    expect(result.current.isLoggedIn).toBe(false);

    await act(async () => {
      const ok = await result.current.agregarAlCarrito({
        id: 10,
        nombre: 'Phone',
        precio: 500000,
        referencia: 'REF-10',
        colores_disponibles: ['Negro'],
      });
      expect(ok).toBe(true);
    });

    expect(result.current.carrito).toHaveLength(1);
    expect(result.current.itemCount).toBe(1);

    const stored = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].productId).toBe(10);
    expect(stored[0].cantidad).toBe(1);
  });

  it('suma cantidad si se agrega el mismo producto y color', async () => {
    const { result } = renderHook(() => useCarrito(), { wrapper });

    await waitFor(() => expect(result.current.isAuthLoading).toBe(false));

    const producto = {
      id: 2,
      nombre: 'X',
      precio: 100,
      referencia: 'R2',
      color_variants: [{ color: 'Azul' }],
    };

    await act(async () => {
      await result.current.agregarAlCarrito(producto, 1);
    });
    await act(async () => {
      await result.current.agregarAlCarrito(producto, 2);
    });

    expect(result.current.carrito).toHaveLength(1);
    expect(result.current.carrito[0].cantidad).toBe(3);
    expect(result.current.itemCount).toBe(3);
  });
});
