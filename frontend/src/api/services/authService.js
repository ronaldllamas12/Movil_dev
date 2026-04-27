import apiClient from '../axiosClient';

export async function loginUser(credentials) {
  const response = await apiClient.post('/auth/login', credentials);

  if (response.data?.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }

  return response.data;
}

export async function registerUser({ email, password, fullName }) {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    full_name: fullName,
    role: 'usuario',
  });

  return response.data;
}

export async function loginWithGoogle(idToken) {
  const response = await apiClient.post('/auth/google', {
    id_token: idToken,
  });

  if (response.data?.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }

  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export async function updatePassword({ newPassword, currentPassword }) {
  const payload = {
    new_password: newPassword,
  };

  if (currentPassword?.trim()) {
    payload.current_password = currentPassword;
  }

  const response = await apiClient.post('/auth/password', payload);
  return response.data;
}

export async function logoutUser() {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    localStorage.removeItem('access_token');
  }
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/auth/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function updateShippingProfile({ receiverName, phone, address, city }) {
  const response = await apiClient.patch('/auth/me/shipping', {
    receiver_name: receiverName,
    phone,
    address,
    city,
  });

  return response.data;
}

export async function forgotPassword(email) {
  const response = await apiClient.post('/auth/forgot-password', {
    email,
  });

  return response.data;
}

export async function resetPassword({ token, newPassword }) {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    new_password: newPassword,
  });

  return response.data;
}
