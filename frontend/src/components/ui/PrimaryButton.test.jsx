/**
 * Test de componente UI: comprobamos comportamiento accesible y de estado (loading/disabled).
 * React Testing Library favorece probar lo que vería el usuario, no detalles internos del componente.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import PrimaryButton from './PrimaryButton.jsx';

describe('PrimaryButton', () => {
  it('renderiza el texto hijo y responde al click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<PrimaryButton onClick={onClick}>Comprar</PrimaryButton>);

    await user.click(screen.getByRole('button', { name: /comprar/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('deshabilita el botón y muestra spinner cuando loading=true', () => {
    render(
      <PrimaryButton loading>
        Guardar
      </PrimaryButton>,
    );

    const btn = screen.getByRole('button', { name: /guardar/i });
    expect(btn).toBeDisabled();
    // Loader2 de lucide-react renderiza un svg en el DOM
    expect(btn.querySelector('svg')).toBeTruthy();
  });

  it('respeta type="submit" para formularios', () => {
    render(<PrimaryButton type="submit">Enviar</PrimaryButton>);
    expect(screen.getByRole('button', { name: /enviar/i })).toHaveAttribute('type', 'submit');
  });
});
