import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export default function useGoogleAuth({ onCredential, activeTab }) {
  const googleButtonRef = useRef(null);
  const googleButtonRegisterRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const [googleScriptError, setGoogleScriptError] = useState('');
  const isGoogleEnabled = Boolean(GOOGLE_CLIENT_ID);

  const renderGoogleButtons = () => {
    if (!window.google?.accounts?.id) return;
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 360,
      });
    }
    if (googleButtonRegisterRef.current) {
      window.google.accounts.id.renderButton(googleButtonRegisterRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signup_with',
        width: 360,
      });
    }
  };

  useEffect(() => {
    const initializeGoogleButton = () => {
      if (!window.google?.accounts?.id || googleInitializedRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onCredential,
        auto_select: false,
        button_auto_select: false,
        use_fedcm_for_button: false,
        use_fedcm_for_prompt: false,
      });

      renderGoogleButtons();
      googleInitializedRef.current = true;
    };

    if (!isGoogleEnabled) return undefined;

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    const handleScriptLoad = () => initializeGoogleButton();

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initializeGoogleButton();
      } else {
        existingScript.addEventListener('load', handleScriptLoad);
      }
      return () => existingScript.removeEventListener('load', handleScriptLoad);
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', () => {
      setGoogleScriptError(
        'No se pudo cargar Google Sign-In. Verifica la configuración en producción.',
      );
    });
    document.head.appendChild(script);

    return () => script.removeEventListener('load', handleScriptLoad);
  }, [isGoogleEnabled]);

  useEffect(() => {
    if (!isGoogleEnabled || !googleInitializedRef.current) return;
    renderGoogleButtons();
  }, [activeTab, isGoogleEnabled]);

  return {
    googleButtonRef,
    googleButtonRegisterRef,
    isGoogleEnabled,
    googleScriptError,
  };
}
