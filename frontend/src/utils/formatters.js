/**
 * Formatea un valor numérico como moneda colombiana (COP).
 * @param {number|string} value
 * @returns {string}
 */
export const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
