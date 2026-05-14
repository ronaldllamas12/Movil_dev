/**
 * Pruebas del servicio de autenticación con el cliente HTTP mockeado.
 *
 * Objetivo: verificar rutas, cuerpos de petición y efectos locales (localStorage)
 * sin levantar el backend ni hacer red real.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiClientMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../axiosClient.js', () => ({
  default: apiClientMock,
}));

import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  registerUser,
  resetPassword,
  updatePassword,
  updateShippingProfile,
  uploadAvatar,
} from './authService.js';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loginUser POST /auth/login y guarda access_token', async () => {
    apiClientMock.post.mockResolvedValue({
      data: { access_token: 'jwt-123', user: { id: 1 } },
    });

    const data = await loginUser({ email: 'a@b.com', password: 'secret' });

    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'secret',
    });
    expect(localStorage.getItem('access_token')).toBe('jwt-123');
    expect(data.access_token).toBe('jwt-123');
  });

  it('registerUser envía full_name y rol usuario', async () => {
    apiClientMock.post.mockResolvedValue({ data: { ok: true } });

    await registerUser({ email: 'e', password: 'p', fullName: 'Nombre' });

    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/register', {
      email: 'e',
      password: 'p',
      full_name: 'Nombre',
      role: 'usuario',
    });
  });

  it('loginWithGoogle envía id_token y persiste token', async () => {
    apiClientMock.post.mockResolvedValue({ data: { access_token: 'g-token' } });

    await loginWithGoogle('google-id-token');

    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/google', {
      id_token: 'google-id-token',
    });
    expect(localStorage.getItem('access_token')).toBe('g-token');
  });

  it('getCurrentUser hace GET /auth/me', async () => {
    apiClientMock.get.mockResolvedValue({ data: { email: 'u@test.com' } });

    const user = await getCurrentUser();

    expect(apiClientMock.get).toHaveBeenCalledWith('/auth/me');
    expect(user.email).toBe('u@test.com');
  });

  it('updatePassword incluye current_password solo si viene no vacío', async () => {
    apiClientMock.post.mockResolvedValue({ data: {} });

    await updatePassword({ newPassword: 'nueva', currentPassword: '   ' });
    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/password', {
      new_password: 'nueva',
    });

    vi.clearAllMocks();
    await updatePassword({ newPassword: 'nueva', currentPassword: 'actual' });
    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/password', {
      new_password: 'nueva',
      current_password: 'actual',
    });
  });

  it('logoutUser limpia token aunque falle el POST', async () => {
    localStorage.setItem('access_token', 'x');
    apiClientMock.post.mockRejectedValue(new Error('red'));

    await expect(logoutUser()).rejects.toThrow('red');
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('forgotPassword y resetPassword llaman los endpoints esperados', async () => {
    apiClientMock.post.mockResolvedValue({ data: { message: 'ok' } });

    await forgotPassword('mail@test.com');
    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'mail@test.com',
    });

    await resetPassword({ token: 't1', newPassword: 'np' });
    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 't1',
      new_password: 'np',
    });
  });

  it('updateShippingProfile serializa snake_case', async () => {
    apiClientMock.patch.mockResolvedValue({ data: {} });

    await updateShippingProfile({
      receiverName: 'Ana',
      phone: '300',
      address: 'Calle 1',
      city: 'BOG',
    });

    expect(apiClientMock.patch).toHaveBeenCalledWith('/auth/me/shipping', {
      receiver_name: 'Ana',
      phone: '300',
      address: 'Calle 1',
      city: 'BOG',
    });
  });

  it('uploadAvatar envía multipart con el archivo', async () => {
    apiClientMock.post.mockResolvedValue({ data: { url: 'https://cdn/x.png' } });
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });

    const res = await uploadAvatar(file);

    expect(res.url).toBe('https://cdn/x.png');
    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/auth/me/avatar',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });
});
