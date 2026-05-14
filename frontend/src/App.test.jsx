/**
 * Integración ligera de rutas: MemoryRouter + CarritoProvider + App.
 *
 * getProducts está mockeado para no depender del backend al montar la home.
 * Aquí comprobamos que la URL inicial pinta la pantalla esperada (ej. /login).
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App.jsx';
import { CarritoProvider } from './context/CarritoContext.jsx';

vi.mock('./api/services/productsService', () => ({
  getProducts: vi.fn(() => Promise.resolve([])),
}));

describe('App (rutas)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function renderAt(path) {
    return render(
      <CarritoProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </CarritoProvider>,
    );
  }

  it('en /login muestra el formulario de inicio de sesión', async () => {
    renderAt('/login');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 2, name: /iniciar sesión/i }),
      ).toBeInTheDocument();
    });
  });

  it('en / renderiza secciones principales del home', async () => {
    renderAt('/');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /más vendidos/i })).toBeInTheDocument();
    });
  });
});
