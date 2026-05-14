/**
 * Archivo de setup global de Vitest.
 *
 * Se ejecuta antes de cada archivo de test (ver `setupFiles` en vite.config.js).
 * Aquí extendemos los matchers de `expect` con los de @testing-library/jest-dom,
 * por ejemplo: expect(elemento).toBeInTheDocument(), toHaveAttribute(), etc.
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * jsdom no implementa matchMedia; ThemeContext lo usa para prefers-color-scheme.
 * Sin esto, cualquier test que monte ThemeProvider (p. ej. App) falla.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
