import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./api/services/productsService', () => ({
  getProducts: vi.fn(async () => []),
}));

vi.mock('./context/CarritoContext', () => ({
  useCarrito: () => ({ currentUser: { id: 1, email: 'qa@example.com' } }),
}));

vi.mock('./components/AdminDashboard', () => ({ default: () => <div>AdminDashboardPage</div> }));
vi.mock('./components/Cancel', () => ({ default: () => <div>CancelPage</div> }));
vi.mock('./components/Carrito', () => ({ default: () => <div>CarritoPage</div> }));
vi.mock('./components/Catalogo', () => ({ default: () => <div>CatalogoPage</div> }));
vi.mock('./components/categories', () => ({ default: () => <div>CategoriesSection</div> }));
vi.mock('./components/CheckoutSteps', () => ({ default: () => <div>CheckoutStepsPage</div> }));
vi.mock('./components/ContactBanner', () => ({ default: () => <div>ContactBannerSection</div> }));
vi.mock('./components/EpaycoCheckoutWindow', () => ({ default: () => <div>EpaycoPage</div> }));
vi.mock('./components/Features', () => ({ default: () => <div>FeaturesSection</div> }));
vi.mock('./components/Footer', () => ({ default: () => <div>FooterSection</div> }));
vi.mock('./components/Hero', () => ({ default: () => <div>HeroSection</div> }));
vi.mock('./components/Login', () => ({ default: () => <div>LoginPage</div> }));
vi.mock('./components/Navbar', () => ({ default: () => <div>NavbarSection</div> }));
vi.mock('./components/Perfil', () => ({ default: () => <div>PerfilPage</div> }));
vi.mock('./components/ProductCard', () => ({ default: () => <div>ProductCard</div> }));
vi.mock('./components/Success', () => ({ default: () => <div>SuccessPage</div> }));

import App from './App';

describe('App routes integration', () => {
  it('renderiza login en /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('renderiza dashboard en /dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('AdminDashboardPage')).toBeInTheDocument();
  });

  it('renderiza home con secciones principales', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('HeroSection')).toBeInTheDocument();
    expect(screen.getByText('FeaturesSection')).toBeInTheDocument();
    expect(screen.getByText('CategoriesSection')).toBeInTheDocument();
  });
});
