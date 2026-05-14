import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetCurrentUser,
  mockLogoutUser,
  mockAddToCart,
  mockGetCartItems,
  mockGetCartTotal,
  mockMergeCart,
  mockRemoveFromCart,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockLogoutUser: vi.fn(),
  mockAddToCart: vi.fn(),
  mockGetCartItems: vi.fn(),
  mockGetCartTotal: vi.fn(),
  mockMergeCart: vi.fn(),
  mockRemoveFromCart: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  getApiErrorMessage: vi.fn((err) => err?.message || 'Error'),
}));

vi.mock('../api/services/authService', () => ({
  getCurrentUser: mockGetCurrentUser,
  logoutUser: mockLogoutUser,
}));

vi.mock('../api/services/cartService', () => ({
  addToCart: mockAddToCart,
  getCartItems: mockGetCartItems,
  getCartTotal: mockGetCartTotal,
  mergeCart: mockMergeCart,
  removeFromCart: mockRemoveFromCart,
}));

import { CarritoProvider, useCarrito } from './CarritoContext';

function Harness() {
  const ctx = useCarrito();
  return (
    <div>
      <div data-testid="count">{ctx.itemCount}</div>
      <div data-testid="total">{ctx.total}</div>
      <button
        onClick={() =>
          ctx.agregarAlCarrito({
            id: 1,
            referencia: 'REF-1',
            nombre: 'Prod 1',
            precio: 100,
            colores_disponibles: ['Negro'],
          })
        }
      >
        add
      </button>
      <button onClick={() => ctx.actualizarCantidad(1, -1)}>dec</button>
      <button onClick={() => ctx.eliminarDelCarrito(1)}>remove</button>
    </div>
  );
}

describe('CarritoContext guest flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetCurrentUser.mockRejectedValue(new Error('sin sesion'));
    mockGetCartItems.mockResolvedValue([]);
    mockGetCartTotal.mockResolvedValue({
      subtotal: 0,
      tax_percent: 0,
      tax_amount: 0,
      shipping_fee: 0,
      total: 0,
    });
  });

  it('agrega item guest y recalcula total con impuesto', async () => {
    render(
      <CarritoProvider>
        <Harness />
      </CarritoProvider>,
    );

    fireEvent.click(screen.getByText('add'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('total')).toHaveTextContent('121');
    });
  });

  it('permite decrementar hasta remover item guest', async () => {
    render(
      <CarritoProvider>
        <Harness />
      </CarritoProvider>,
    );

    fireEvent.click(screen.getByText('add'));
    await screen.findByText('dec');

    fireEvent.click(screen.getByText('dec'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0');
      expect(screen.getByTestId('total')).toHaveTextContent('0');
    });
  });

  it('eliminar en guest limpia el item por id', async () => {
    render(
      <CarritoProvider>
        <Harness />
      </CarritoProvider>,
    );

    fireEvent.click(screen.getByText('add'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('remove'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
  });
});
