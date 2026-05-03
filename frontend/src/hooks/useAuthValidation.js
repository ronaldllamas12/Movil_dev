import { useState } from 'react';

const validateEmail = (emailValue) => {
  if (!emailValue.trim()) return 'El email es requerido';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailValue))
    return 'El email debe tener un formato válido (ejemplo: usuario@dominio.com)';
  return '';
};

const validatePassword = (passwordValue) => {
  if (!passwordValue) return 'La contraseña es requerida';
  if (passwordValue.length < 8)
    return `La contraseña debe tener al menos 8 caracteres (tienes ${passwordValue.length})`;
  return '';
};

const validateName = (nameValue) => {
  if (!nameValue.trim()) return 'El nombre es requerido';
  if (nameValue.trim().length < 2)
    return `El nombre debe tener al menos 2 caracteres (tienes ${nameValue.trim().length})`;
  return '';
};

const validateConfirmPassword = (pwd, confirmPwd) => {
  if (!confirmPwd) return 'Confirmar contraseña es requerido';
  if (pwd !== confirmPwd) return 'Las contraseñas no coinciden';
  return '';
};

export default function useAuthValidation() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleNameChange = (value) => {
    setName(value);
    setNameError(validateName(value));
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (confirmPassword)
      setConfirmPasswordError(validateConfirmPassword(value, confirmPassword));
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setConfirmPasswordError(validateConfirmPassword(password, value));
  };

  const isRegisterFormValid = () =>
    !nameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    name.trim() &&
    email.trim() &&
    password &&
    confirmPassword;

  const validateAllRegisterFields = () => {
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(password, confirmPassword);
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);
    return { nameErr, emailErr, passwordErr, confirmPasswordErr };
  };

  const clearRegisterFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  return {
    name,
    handleNameChange,
    nameError,
    email,
    setEmail,
    handleEmailChange,
    emailError,
    password,
    setPassword,
    handlePasswordChange,
    passwordError,
    confirmPassword,
    handleConfirmPasswordChange,
    confirmPasswordError,
    isRegisterFormValid,
    validateAllRegisterFields,
    clearRegisterFields,
  };
}
