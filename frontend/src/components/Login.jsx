import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/axiosClient';
import {
    forgotPassword,
    loginUser,
    loginWithGoogle,
    registerUser,
    resetPassword,
} from '../api/services/authService';
import { useCarrito } from '../context/CarritoContext';
import useAuthValidation from '../hooks/useAuthValidation';
import useGoogleAuth from '../hooks/useGoogleAuth';
import AuthTabs from './auth/AuthTabs';
import ForgotPasswordForm from './auth/ForgotPasswordForm';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import ResetPasswordForm from './auth/ResetPasswordForm';
import Alert from './ui/Alert';

function getPostLoginPath(user) {
  return user?.role === 'administrador' ? '/dashboard' : '/';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCarrito();

  const [authView, setAuthView] = useState('tabs');
  const [activeTab, setActiveTab] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    name,
    handleNameChange,
    nameError,
    email: registerEmail,
    handleEmailChange,
    emailError,
    password: registerPassword,
    handlePasswordChange,
    passwordError,
    confirmPassword,
    handleConfirmPasswordChange,
    confirmPasswordError,
    isRegisterFormValid,
    validateAllRegisterFields,
    clearRegisterFields,
  } = useAuthValidation();

  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const handleGoogleCredential = async (response) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const data = await loginWithGoogle(response.credential);
      login(data.user);
      navigate(getPostLoginPath(data.user));
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const { googleButtonRef, googleButtonRegisterRef, isGoogleEnabled, googleScriptError } =
    useGoogleAuth({ onCredential: handleGoogleCredential, activeTab });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromLink = params.get('token');
    if (!tokenFromLink) return;
    setResetToken(tokenFromLink);
    setAuthView('reset');
    setErrorMsg('');
    setForgotSuccessMsg('');
    setResetSuccessMsg('');
    navigate('/login', { replace: true });
  }, [location.search, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const data = await loginUser({ email: loginEmail, password: loginPassword });
      login(data.user);
      navigate(getPostLoginPath(data.user));
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const { nameErr, emailErr, passwordErr, confirmPasswordErr } = validateAllRegisterFields();
    if (nameErr || emailErr || passwordErr || confirmPasswordErr) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await registerUser({ email: registerEmail, password: registerPassword, fullName: name });
      const data = await loginUser({ email: registerEmail, password: registerPassword });
      login(data.user);
      clearRegisterFields();
      navigate(getPostLoginPath(data.user));
    } catch (error) {
      if (error?.response?.status === 422 && Array.isArray(error?.response?.data?.detail)) {
        const detailArr = error.response.data.detail;
        const pwdError = detailArr.find(
          (e) =>
            e?.loc?.includes('password') &&
            (e?.msg?.toLowerCase().includes('longitud mínima') ||
              e?.msg?.toLowerCase().includes('al menos 8 caracteres')),
        );
        if (pwdError) {
          setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
          return;
        }
        setErrorMsg(detailArr.map((e) => e?.msg || JSON.stringify(e)));
        return;
      }
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setForgotSuccessMsg('');
    try {
      const response = await forgotPassword(forgotEmail);
      setForgotSuccessMsg(response?.message || 'Solicitud procesada.');
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setResetSuccessMsg('');

    if (!resetToken.trim()) {
      setIsSubmitting(false);
      setErrorMsg('El enlace de restablecimiento no es válido o ya expiró. Solicita uno nuevo.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setIsSubmitting(false);
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    try {
      const response = await resetPassword({ token: resetToken, newPassword: resetNewPassword });
      setResetSuccessMsg(response?.message || 'Contraseña actualizada correctamente.');
      setAuthView('tabs');
      setActiveTab('login');
      setLoginPassword('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetToken('');
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToAuthTabs = () => {
    setAuthView('tabs');
    setErrorMsg('');
    setForgotSuccessMsg('');
    setResetSuccessMsg('');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[color:var(--bg)] text-[color:var(--text)] px-4 py-10 md:py-14 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center gap-4 mb-2">
          <img
            src="https://res.cloudinary.com/dms34zmay/image/upload/v1777228417/u015tu0fpx2xuo84zkeg.png"
            alt="Logo de Móvil Dev"
            className="relative z-10 h-40 w-40 object-contain drop-shadow-xl"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold">Movil Dev</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)] max-w-md mx-auto">
              Inicia sesión para seguir con tu compra y acceder a tus pedidos, descuentos y favoritos.
            </p>
          </div>
        </div>

        <div
          className={`mx-auto w-full rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl overflow-hidden transition-all duration-300 ${
            activeTab === 'login' ? 'max-w-lg' : 'max-w-xl'
          }`}
        >
          {authView === 'tabs' && <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} />}

          <div className="p-6 md:p-8">
            <Alert variant="error" message={errorMsg} className="mb-4" />

            {forgotSuccessMsg && authView === 'forgot' && (
              <Alert variant="success" message={forgotSuccessMsg} className="mb-4" />
            )}

            {resetSuccessMsg && authView === 'reset' && (
              <Alert variant="success" message={resetSuccessMsg} className="mb-4" />
            )}

            {authView === 'tabs' && activeTab === 'login' && (
              <LoginForm
                email={loginEmail}
                setEmail={setLoginEmail}
                password={loginPassword}
                setPassword={setLoginPassword}
                showPassword={showLoginPassword}
                setShowPassword={setShowLoginPassword}
                remember={remember}
                setRemember={setRemember}
                isSubmitting={isSubmitting}
                onSubmit={handleLogin}
                onForgotPassword={() => {
                  setAuthView('forgot');
                  setForgotEmail(loginEmail);
                  setErrorMsg('');
                  setForgotSuccessMsg('');
                }}
                isGoogleEnabled={isGoogleEnabled}
                googleButtonRef={googleButtonRef}
                googleScriptError={googleScriptError}
              />
            )}

            {authView === 'tabs' && activeTab === 'register' && (
              <RegisterForm
                name={name}
                handleNameChange={handleNameChange}
                nameError={nameError}
                email={registerEmail}
                handleEmailChange={handleEmailChange}
                emailError={emailError}
                password={registerPassword}
                handlePasswordChange={handlePasswordChange}
                passwordError={passwordError}
                confirmPassword={confirmPassword}
                handleConfirmPasswordChange={handleConfirmPasswordChange}
                confirmPasswordError={confirmPasswordError}
                showPassword={showRegisterPassword}
                setShowPassword={setShowRegisterPassword}
                showConfirmPassword={showRegisterConfirmPassword}
                setShowConfirmPassword={setShowRegisterConfirmPassword}
                isSubmitting={isSubmitting}
                isRegisterFormValid={isRegisterFormValid}
                onSubmit={handleRegister}
                errorMsg={errorMsg}
                isGoogleEnabled={isGoogleEnabled}
                googleButtonRegisterRef={googleButtonRegisterRef}
                googleScriptError={googleScriptError}
              />
            )}

            {authView === 'forgot' && (
              <ForgotPasswordForm
                forgotEmail={forgotEmail}
                setForgotEmail={setForgotEmail}
                isSubmitting={isSubmitting}
                onSubmit={handleForgotPassword}
                onBack={goBackToAuthTabs}
              />
            )}

            {authView === 'reset' && (
              <ResetPasswordForm
                resetNewPassword={resetNewPassword}
                setResetNewPassword={setResetNewPassword}
                resetConfirmPassword={resetConfirmPassword}
                setResetConfirmPassword={setResetConfirmPassword}
                showResetPassword={showResetPassword}
                setShowResetPassword={setShowResetPassword}
                showResetConfirmPassword={showResetConfirmPassword}
                setShowResetConfirmPassword={setShowResetConfirmPassword}
                isSubmitting={isSubmitting}
                onSubmit={handleResetPassword}
                onBack={goBackToAuthTabs}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
