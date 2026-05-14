// el utiliario de carga
//evitar tener que escribir try/catch y manejar estados de loading manualmente en cada componente.
import { useState } from 'react';
import { getApiErrorMessage } from '../api/axiosClient';

/**
 * useAsyncAction — encapsula el patrón try/catch/finally con loading y error.
 *
 * Uso:
 *   const { run, loading, error, clearError } = useAsyncAction();
 *   await run(() => apiCall());
 */
export default function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => setError('');

  const run = async (asyncFn) => {
    setLoading(true);
    setError('');
    try {
      return await asyncFn();
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error, clearError };
}
