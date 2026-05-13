/**
 * AuthErrorMessage puede recibir string, objeto o lista de errores (como devuelve a veces la API).
 * Estos tests documentan las tres ramas de renderizado.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AuthErrorMessage from './AuthErrorMessage.jsx';

describe('AuthErrorMessage', () => {
  it('no renderiza nada si no hay mensaje', () => {
    const { container } = render(<AuthErrorMessage errorMsg="" />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra un párrafo para error string', () => {
    render(<AuthErrorMessage errorMsg="Credenciales inválidas" />);
    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('lista varios mensajes cuando errorMsg es un array', () => {
    render(<AuthErrorMessage errorMsg={['Error A', 'Error B']} />);
    expect(screen.getByText('Error A')).toBeInTheDocument();
    expect(screen.getByText('Error B')).toBeInTheDocument();
  });

  it('extrae .msg de objetos de error', () => {
    render(<AuthErrorMessage errorMsg={{ msg: 'Detalle del servidor' }} />);
    expect(screen.getByText('Detalle del servidor')).toBeInTheDocument();
  });
});
