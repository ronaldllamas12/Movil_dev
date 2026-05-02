import { Home, LogOut, Mail, MapPin, Phone, Shield, Upload, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/axiosClient';
import { updatePassword, updateShippingProfile, uploadAvatar } from '../api/services/authService';
import { useCarrito } from '../context/CarritoContext';
import PasswordInput from './auth/PasswordInput';
import Alert from './ui/Alert';
import InputWithIcon from './ui/InputWithIcon';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?name=Usuario&background=E2E8F0&color=334155&size=256';

export default function Perfil() {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, isAuthLoading, logout, refreshCurrentUser } = useCarrito();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [shippingForm, setShippingForm] = useState(() => {
    const shipping = currentUser?.preferences?.shipping || {};
    return {
      receiverName: shipping.receiver_name || currentUser?.full_name || '',
      phone: shipping.phone || '',
      address: shipping.address || '',
      city: shipping.city || '',
    };
  });

  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isAuthLoading, isLoggedIn, navigate]);

  useEffect(() => {
    const shipping = currentUser?.preferences?.shipping || {};
    setShippingForm({
      receiverName: shipping.receiver_name || currentUser?.full_name || '',
      phone: shipping.phone || '',
      address: shipping.address || '',
      city: shipping.city || '',
    });
  }, [currentUser]);

  if (isAuthLoading || !isLoggedIn) {
    return null;
  }

  const isGoogleOnlyAccount = currentUser?.auth_provider === 'google' || !currentUser?.has_password;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsUploadingAvatar(true);

    try {
      await uploadAvatar(file);
      await refreshCurrentUser();
      setSuccessMsg('Foto de perfil actualizada correctamente.');
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('La confirmación de contraseña no coincide.');
      return;
    }

    if (!isGoogleOnlyAccount && !currentPassword.trim()) {
      setErrorMsg('Debes escribir tu contraseña actual para cambiarla.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await updatePassword({
        newPassword,
        currentPassword: isGoogleOnlyAccount ? undefined : currentPassword,
      });
      await refreshCurrentUser();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(
        isGoogleOnlyAccount
          ? 'Contraseña agregada correctamente. Ya puedes iniciar sesión con Google o con email y contraseña.'
          : 'Contraseña actualizada correctamente.',
      );
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleShippingChange = (event) => {
    const { name, value } = event.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!shippingForm.receiverName.trim()) {
      setErrorMsg('El nombre de quien recibe es obligatorio.');
      return;
    }

    if (shippingForm.phone.trim().length < 7) {
      setErrorMsg('El número telefónico debe tener al menos 7 caracteres.');
      return;
    }

    if (!shippingForm.address.trim() || !shippingForm.city.trim()) {
      setErrorMsg('La dirección y la ciudad son obligatorias.');
      return;
    }

    setIsSavingShipping(true);

    try {
      await updateShippingProfile(shippingForm);
      await refreshCurrentUser();
      setSuccessMsg('Información de envío actualizada correctamente.');
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSavingShipping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-1 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <img
              src={currentUser?.avatar_url || DEFAULT_AVATAR}
              alt={currentUser?.full_name || 'Usuario'}
              className="size-28 rounded-full object-cover border-4 border-[color:var(--surface-muted)]"
            />
            <h1 className="mt-4 text-2xl font-bold text-[color:var(--text)]">
              {currentUser?.full_name || 'Usuario'}
            </h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {currentUser?.email || 'Sin correo disponible'}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
              <Shield className="size-3.5" />
              {currentUser?.auth_provider === 'google' ? 'Cuenta Google' : 'Cuenta local/híbrida'}
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="mt-4 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] py-3 text-sm font-semibold text-[color:var(--text)] transition hover:bg-[color:var(--surface)]"
            >
              <span className="inline-flex items-center gap-2">
                <Upload className="size-4" />
                {isUploadingAvatar ? 'Subiendo foto...' : 'Cambiar foto'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <span className="inline-flex items-center gap-2">
                <LogOut className="size-4" />
                Cerrar sesión
              </span>
            </button>
          </div>
        </section>

        <section className="lg:col-span-2 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 md:p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text)]">Mi perfil</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Aquí puedes ver la información de tu cuenta y gestionar tu método de acceso.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">
                Nombre completo
              </p>
              <p className="mt-2 font-semibold text-[color:var(--text)] inline-flex items-center gap-2">
                <User className="size-4" />
                {currentUser?.full_name || 'Sin nombre'}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">
                Correo electrónico
              </p>
              <p className="mt-2 font-semibold text-[color:var(--text)] inline-flex items-center gap-2">
                <Mail className="size-4" />
                {currentUser?.email || 'Sin correo'}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-[color:var(--text)]">Información de envío</h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Estos datos se usarán automáticamente en tus próximas compras.
            </p>
          </div>

          <form onSubmit={handleShippingSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-[color:var(--text)]">
              Persona que recibe
              <InputWithIcon
                icon={<User className="size-4" />}
                name="receiverName"
                value={shippingForm.receiverName}
                onChange={handleShippingChange}
                placeholder="Nombre completo"
                required
              />
            </label>

            <label className="block text-sm font-medium text-[color:var(--text)]">
              Teléfono
              <InputWithIcon
                icon={<Phone className="size-4" />}
                name="phone"
                value={shippingForm.phone}
                onChange={handleShippingChange}
                placeholder="3101234567"
                required
              />
            </label>

            <label className="block text-sm font-medium text-[color:var(--text)] md:col-span-2">
              Dirección
              <InputWithIcon
                icon={<Home className="size-4" />}
                name="address"
                value={shippingForm.address}
                onChange={handleShippingChange}
                placeholder="Calle, carrera, número, apartamento"
                required
              />
            </label>

            <label className="block text-sm font-medium text-[color:var(--text)]">
              Ciudad
              <InputWithIcon
                icon={<MapPin className="size-4" />}
                name="city"
                value={shippingForm.city}
                onChange={handleShippingChange}
                placeholder="Ciudad"
                required
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSavingShipping}
                className="w-full rounded-2xl bg-purple-700 py-3 px-6 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-70"
              >
                {isSavingShipping ? 'Guardando...' : 'Guardar envío'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-[color:var(--text)]">
              {isGoogleOnlyAccount ? 'Agregar contraseña a cuenta Google' : 'Cambiar contraseña'}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {isGoogleOnlyAccount
                ? 'Activa también el acceso con correo y contraseña para iniciar sesión de ambas formas en el futuro.'
                : 'Actualiza tu contraseña manteniendo la seguridad de tu cuenta.'}
            </p>
          </div>

          <Alert variant="error" message={errorMsg} className="mt-4" />
          <Alert variant="success" message={successMsg} className="mt-4" />

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            {!isGoogleOnlyAccount && (
              <PasswordInput
                label="Contraseña actual"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrentPassword}
                onToggleShow={() => setShowCurrentPassword((v) => !v)}
              />
            )}

            <PasswordInput
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              show={showNewPassword}
              onToggleShow={() => setShowNewPassword((v) => !v)}
            />

            <PasswordInput
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((v) => !v)}
            />

            <button
              type="submit"
              disabled={isSavingPassword}
              className="w-full rounded-2xl bg-[#0f172a] py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {isSavingPassword
                ? 'Guardando...'
                : isGoogleOnlyAccount
                  ? 'Agregar contraseña'
                  : 'Actualizar contraseña'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
