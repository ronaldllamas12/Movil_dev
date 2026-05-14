import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useAuthValidation from './useAuthValidation';

describe('useAuthValidation', () => {
  it('valida errores de registro al enviar formulario vacio', () => {
    const { result } = renderHook(() => useAuthValidation());

    let output;
    act(() => {
      output = result.current.validateAllRegisterFields();
    });

    expect(output.nameErr).toContain('nombre');
    expect(output.emailErr).toContain('email');
    expect(output.passwordErr).toContain('contrase');
    expect(output.confirmPasswordErr).toContain('Confirmar');
    expect(result.current.isRegisterFormValid()).toBeFalsy();
  });

  it('acepta un formulario valido', () => {
    const { result } = renderHook(() => useAuthValidation());

    act(() => {
      result.current.handleNameChange('Juan Perez');
      result.current.handleEmailChange('juan@example.com');
      result.current.handlePasswordChange('12345678');
    });

    act(() => {
      result.current.handleConfirmPasswordChange('12345678');
    });

    expect(result.current.nameError).toBe('');
    expect(result.current.emailError).toBe('');
    expect(result.current.passwordError).toBe('');
    expect(result.current.confirmPasswordError).toBe('');
    expect(result.current.isRegisterFormValid()).toBeTruthy();
  });

  it('limpia campos y errores', () => {
    const { result } = renderHook(() => useAuthValidation());

    act(() => {
      result.current.handleNameChange('A');
      result.current.handleEmailChange('correo-invalido');
      result.current.handlePasswordChange('123');
      result.current.handleConfirmPasswordChange('456');
      result.current.clearRegisterFields();
    });

    expect(result.current.name).toBe('');
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.confirmPassword).toBe('');
    expect(result.current.nameError).toBe('');
    expect(result.current.emailError).toBe('');
    expect(result.current.passwordError).toBe('');
    expect(result.current.confirmPasswordError).toBe('');
  });
});
