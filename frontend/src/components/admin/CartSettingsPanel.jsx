import { Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getCartTaxSettings, updateCartTaxSettings } from '../../api/services/cartService';
import { getProducts } from '../../api/services/productsService';
import { useCarrito } from '../../context/CarritoContext';

export default function CartSettingsPanel() {
  const { cartSettings, updateCartSettings, refreshCart } = useCarrito();

  const [products, setProducts] = useState([]);
  const [taxRateInput, setTaxRateInput] = useState(String(cartSettings.taxRate));
  const [selectedDiscountReference, setSelectedDiscountReference] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const referenceToProductMap = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.referencia] = product;
      return acc;
    }, {});
  }, [products]);

  useEffect(() => {
    setTaxRateInput(String(cartSettings.taxRate));
  }, [cartSettings.taxRate]);

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, productsData] = await Promise.all([
          getCartTaxSettings(),
          getProducts(),
        ]);
        const nextTaxRate = Number(settings?.tax_percent ?? cartSettings.taxRate);
        updateCartSettings({ taxRate: nextTaxRate });
        setTaxRateInput(String(nextTaxRate));
        setProducts(productsData);
      } catch {
        setProducts([]);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const hasValidSelection = products.some(
      (item) => item.referencia === selectedDiscountReference,
    );

    if (products.length === 0) {
      if (selectedDiscountReference) {
        setSelectedDiscountReference('');
      }
      return;
    }

    if (!hasValidSelection) {
      setSelectedDiscountReference(products[0].referencia);
    }
  }, [products, selectedDiscountReference]);

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSaveTaxRate = async (event) => {
    event.preventDefault();
    resetMessages();

    const parsed = Number(taxRateInput);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setErrorMsg('El impuesto debe estar entre 0 y 100.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateCartTaxSettings(parsed);
      updateCartSettings({ taxRate: Number(updated.tax_percent) });
      await refreshCart();
      setSuccessMsg('Impuesto del carrito actualizado correctamente.');
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo actualizar el impuesto del carrito.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDiscountRule = (event) => {
    event.preventDefault();
    resetMessages();

    const referencia = selectedDiscountReference.trim();
    const porcentaje = Number(discountPercentInput);

    if (!referencia) {
      setErrorMsg('Debes seleccionar un producto existente.');
      return;
    }

    if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
      setErrorMsg('El descuento debe ser mayor a 0 y menor o igual a 100.');
      return;
    }

    const previousRules = Array.isArray(cartSettings.discountRules)
      ? cartSettings.discountRules
      : [];

    const nextRules = [
      ...previousRules.filter((item) => item.referencia !== referencia),
      { referencia, porcentaje },
    ];

    updateCartSettings({ discountRules: nextRules });
    setDiscountPercentInput('');
    setSuccessMsg('Descuento guardado correctamente.');
  };

  const handleDeleteDiscountRule = (referencia) => {
    resetMessages();
    const nextRules = (cartSettings.discountRules || []).filter((item) => item.referencia !== referencia);
    updateCartSettings({ discountRules: nextRules });
    setSuccessMsg('Descuento eliminado correctamente.');
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
      {errorMsg ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}
      {successMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
      ) : null}

      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <Settings2 className="size-4" />
        Configuracion del carrito
      </div>

      <form onSubmit={handleSaveTaxRate} className="flex flex-col md:flex-row gap-3 md:items-end">
        <label className="flex flex-col gap-1 text-sm text-slate-700 w-full md:max-w-xs">
          Impuesto (IVA %)
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={taxRateInput}
            onChange={(event) => setTaxRateInput(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-700 disabled:opacity-60"
        >
          Guardar impuesto
        </button>
      </form>

      <form onSubmit={handleAddDiscountRule} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Producto a descontar
          <select
            value={selectedDiscountReference}
            onChange={(event) => setSelectedDiscountReference(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2"
            disabled={products.length === 0}
          >
            {products.length === 0 ? (
              <option value="">No hay productos disponibles</option>
            ) : (
              products.map((product) => (
                <option key={product.id} value={product.referencia}>
                  {product.nombre} - {product.referencia}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Descuento (%)
          <input
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={discountPercentInput}
            onChange={(event) => setDiscountPercentInput(event.target.value)}
            placeholder="Ej: 10"
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500"
        >
          Guardar descuento
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">Descuentos activos por referencia</div>
        <div className="divide-y divide-slate-100">
          {(cartSettings.discountRules || []).length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No hay descuentos configurados.</p>
          ) : (
            (cartSettings.discountRules || []).map((rule) => (
              <div key={rule.referencia} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  {(referenceToProductMap[rule.referencia]?.nombre || 'Producto')} - {rule.referencia} - {rule.porcentaje}%
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteDiscountRule(rule.referencia)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
