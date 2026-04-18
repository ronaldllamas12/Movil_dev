import { Loader2, Pencil, Plus, Power, Settings2, Shield, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCartTaxSettings, updateCartTaxSettings } from '../api/services/cartService';
import {
    createProduct,
    deleteProduct,
    getProducts,
    toggleProductStatus,
    updateProduct
} from '../api/services/productsService';
import { useCarrito } from '../context/CarritoContext';

const CATEGORY_OPTIONS = ['premium', 'gama media', 'economico'];

const BASE_CREATE_FORM = {
  marca: '',
  referencia: '',
  nombre: '',
  categoria: 'premium',
  descripcion_breve: '',
  cantidad_stock: '',
  precio_unitario: '',
  tamano_memoria_ram: '',
  rom: '',
  conectividad: '',
  procesador: '',
  dimensiones: '',
  bateria: '',
  resolucion_camara_principal: '',
  resolucion_camara_frontal: '',
  capacidad_carga_rapida: '',
  garantia_meses: '',
  imagen_url: '',
  colores_disponibles: '',
  is_active: true,
};

const BASE_EDIT_FORM = {
  marca: '',
  referencia: '',
  nombre: '',
  categoria: 'premium',
  descripcion_breve: '',
  cantidad_stock: '',
  precio_unitario: '',
  tamano_memoria_ram: '',
  rom: '',
  conectividad: '',
  procesador: '',
  dimensiones: '',
  bateria: '',
  resolucion_camara_principal: '',
  resolucion_camara_frontal: '',
  capacidad_carga_rapida: '',
  garantia_meses: '',
  imagen_url: '',
  colores_disponibles: '',
  is_active: true,
};

function toPayload(form) {
  return {
    marca: form.marca.trim(),
    referencia: form.referencia.trim(),
    nombre: form.nombre.trim(),
    categoria: form.categoria,
    descripcion_breve: form.descripcion_breve.trim(),
    cantidad_stock: Number(form.cantidad_stock || 0),
    precio_unitario: Number(form.precio_unitario || 0),
    tamano_memoria_ram: form.tamano_memoria_ram.trim(),
    rom: form.rom.trim(),
    colores_disponibles: form.colores_disponibles
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    conectividad: form.conectividad.trim(),
    procesador: form.procesador.trim(),
    dimensiones: form.dimensiones.trim(),
    bateria: form.bateria.trim(),
    resolucion_camara_principal: form.resolucion_camara_principal.trim(),
    resolucion_camara_frontal: form.resolucion_camara_frontal.trim(),
    capacidad_carga_rapida: form.capacidad_carga_rapida.trim(),
    garantia_meses: Number(form.garantia_meses || 0),
    imagen_url: form.imagen_url.trim() || null,
    is_active: form.is_active,
  };
}

function productToEditForm(product) {
  return {
    marca: product.marca || '',
    referencia: product.referencia || '',
    nombre: product.nombre || '',
    categoria: product.categoria || 'premium',
    descripcion_breve: product.descripcion_breve || '',
    cantidad_stock: String(product.cantidad_stock ?? ''),
    precio_unitario: String(product.precio_unitario ?? ''),
    tamano_memoria_ram: product.tamano_memoria_ram || '',
    rom: product.rom || '',
    conectividad: product.conectividad || '',
    procesador: product.procesador || '',
    dimensiones: product.dimensiones || '',
    bateria: product.bateria || '',
    resolucion_camara_principal: product.resolucion_camara_principal || '',
    resolucion_camara_frontal: product.resolucion_camara_frontal || '',
    capacidad_carga_rapida: product.capacidad_carga_rapida || '',
    garantia_meses: String(product.garantia_meses ?? ''),
    imagen_url: product.imagen_url || '',
    colores_disponibles: Array.isArray(product.colores_disponibles)
      ? product.colores_disponibles.join(', ')
      : '',
    is_active: Boolean(product.is_active),
  };
}

function FormInput({ label, name, value, onChange, required = false, type = 'text', placeholder = '', min, step }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        min={min}
        step={step}
        className="rounded-xl border border-slate-300 px-3 py-2"
        required={required}
      />
    </label>
  );
}

function FormTextarea({ label, name, value, onChange, required = false, placeholder = '' }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2 lg:col-span-3">
      {label}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-xl border border-slate-300 px-3 py-2 min-h-20"
        required={required}
      />
    </label>
  );
}

function ProductFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <FormInput label="Marca" name="marca" value={form.marca} onChange={onChange} required placeholder="Ej: Apple" />
      <FormInput label="Referencia" name="referencia" value={form.referencia} onChange={onChange} required placeholder="Ej: APL-IP15PM-256" />
      <FormInput label="Nombre" name="nombre" value={form.nombre} onChange={onChange} required placeholder="Ej: iPhone 15 Pro Max" />

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Categoría
        <select
          name="categoria"
          value={form.categoria}
          onChange={onChange}
          className="rounded-xl border border-slate-300 px-3 py-2"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <FormInput
        label="Cantidad en stock"
        name="cantidad_stock"
        value={form.cantidad_stock}
        onChange={onChange}
        required
        type="number"
        min="0"
        placeholder="Ej: 25"
      />
      <FormInput
        label="Precio unitario"
        name="precio_unitario"
        value={form.precio_unitario}
        onChange={onChange}
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Ej: 4599000"
      />

      <FormTextarea
        label="Descripción breve"
        name="descripcion_breve"
        value={form.descripcion_breve}
        onChange={onChange}
        required
        placeholder="Resumen corto del equipo"
      />

      <FormInput label="Memoria RAM" name="tamano_memoria_ram" value={form.tamano_memoria_ram} onChange={onChange} required placeholder="Ej: 8 GB" />
      <FormInput label="Almacenamiento ROM" name="rom" value={form.rom} onChange={onChange} required placeholder="Ej: 256 GB" />
      <FormInput
        label="Garantía (meses)"
        name="garantia_meses"
        value={form.garantia_meses}
        onChange={onChange}
        required
        type="number"
        min="0"
        placeholder="Ej: 12"
      />

      <label className="md:col-span-2 lg:col-span-3 flex flex-col gap-1 text-sm text-slate-700">
        Colores disponibles (separados por coma)
        <input
          name="colores_disponibles"
          value={form.colores_disponibles}
          onChange={onChange}
          placeholder="Ej: Negro, Azul, Rojo"
          className="rounded-xl border border-slate-300 px-3 py-2"
          required
        />
      </label>

      <FormInput label="Conectividad" name="conectividad" value={form.conectividad} onChange={onChange} required placeholder="Ej: 5G, Wi-Fi 6, Bluetooth 5.3" />
      <FormInput label="Procesador" name="procesador" value={form.procesador} onChange={onChange} required placeholder="Ej: Snapdragon 8 Gen 3" />
      <FormInput label="Dimensiones" name="dimensiones" value={form.dimensiones} onChange={onChange} required placeholder="Ej: 162 x 75 x 8 mm" />

      <FormInput label="Batería" name="bateria" value={form.bateria} onChange={onChange} required placeholder="Ej: 5000 mAh" />
      <FormInput
        label="Cámara principal"
        name="resolucion_camara_principal"
        value={form.resolucion_camara_principal}
        onChange={onChange}
        required
        placeholder="Ej: 50 MP"
      />
      <FormInput
        label="Cámara frontal"
        name="resolucion_camara_frontal"
        value={form.resolucion_camara_frontal}
        onChange={onChange}
        required
        placeholder="Ej: 32 MP"
      />

      <FormInput
        label="Carga rápida"
        name="capacidad_carga_rapida"
        value={form.capacidad_carga_rapida}
        onChange={onChange}
        required
        placeholder="Ej: 67W"
      />

      <label className="md:col-span-2 lg:col-span-3 flex flex-col gap-1 text-sm text-slate-700">
        URL de imagen (opcional)
        <input
          name="imagen_url"
          value={form.imagen_url}
          onChange={onChange}
          placeholder="https://..."
          className="rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="md:col-span-2 lg:col-span-3 inline-flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="is_active"
          checked={form.is_active}
          onChange={onChange}
          className="size-4"
        />
        Producto activo
      </label>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading, currentUser, cartSettings, updateCartSettings, refreshCart } = useCarrito();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [createForm, setCreateForm] = useState(BASE_CREATE_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(BASE_EDIT_FORM);

  const [taxRateInput, setTaxRateInput] = useState(String(cartSettings.taxRate));
  const [selectedDiscountReference, setSelectedDiscountReference] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState('');

  const isAdmin = currentUser?.role === 'administrador';
  const visibleProducts = useMemo(() => products.slice(0, 100), [products]);
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
    if (isAuthLoading) {
      return;
    }

    if (!isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate('/perfil', { replace: true });
    }
  }, [isAdmin, isAuthLoading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const loadTaxSettings = async () => {
      try {
        const settings = await getCartTaxSettings();
        const nextTaxRate = Number(settings?.tax_percent ?? cartSettings.taxRate);
        updateCartSettings({ taxRate: nextTaxRate });
        setTaxRateInput(String(nextTaxRate));
      } catch {
        // El dashboard puede seguir usando el valor ya sincronizado en contexto.
      }
    };

    loadTaxSettings();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setErrorMsg('');

      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        setErrorMsg(error?.response?.data?.detail || 'No se pudieron cargar productos.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAdmin]);

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

  const handleFormInput = (setForm) => (event) => {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    resetMessages();
    setIsSaving(true);

    try {
      const created = await createProduct(toPayload(createForm));
      setProducts((prev) => [created, ...prev]);
      setCreateForm(BASE_CREATE_FORM);
      setSuccessMsg('Producto creado correctamente.');
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo crear el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (product) => {
    resetMessages();
    setEditingId(product.id);
    setEditForm(productToEditForm(product));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(BASE_EDIT_FORM);
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    resetMessages();
    setIsSaving(true);

    try {
      const updated = await updateProduct(editingId, toPayload(editForm));
      setProducts((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      cancelEditing();
      setSuccessMsg('Producto actualizado correctamente.');
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo actualizar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    resetMessages();
    setIsSaving(true);

    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      if (editingId === productId) {
        cancelEditing();
      }
      setSuccessMsg('Producto eliminado correctamente.');
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo eliminar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProduct = async (product) => {
    resetMessages();
    setIsSaving(true);

    try {
      const updated = await toggleProductStatus(product.id, !product.is_active);
      setProducts((prev) => prev.map((item) => (item.id === product.id ? updated : item)));
      if (editingId === product.id) {
        setEditForm(productToEditForm(updated));
      }
      setSuccessMsg(`Producto ${updated.is_active ? 'activado' : 'desactivado'} correctamente.`);
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo cambiar el estado del producto.');
    } finally {
      setIsSaving(false);
    }
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

  if (isAuthLoading || isLoading) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 flex items-center gap-3">
          <Loader2 className="size-5 animate-spin" />
          Cargando dashboard de administrador...
        </div>
      </section>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <header className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-cyan-50 p-6">
        <div className="flex items-center gap-3 text-indigo-700 mb-2">
          <Shield className="size-5" />
          <p className="font-semibold">Panel de administración</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard  de productos MOVIL-DEV</h1>
        <p className="text-slate-600 mt-1">Gestiona inventario, estado, IVA del carrito y descuentos por referencia.</p>
      </header>

      {errorMsg ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}
      {successMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <Settings2 className="size-4" />
          Configuración del carrito
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
            className="rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-700"
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

      <form onSubmit={handleCreateProduct} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <Plus className="size-4" />
          Crear producto
        </div>
        <ProductFields form={createForm} onChange={handleFormInput(setCreateForm)} />
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-700 disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Guardar producto
        </button>
      </form>

      {editingId ? (
        <form onSubmit={handleUpdateProduct} className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Pencil className="size-4" />
              Editando producto #{editingId}
            </div>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              Cancelar edición
            </button>
          </div>
          <ProductFields form={editForm} onChange={handleFormInput(setEditForm)} />
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
            Guardar cambios
          </button>
        </form>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Productos ({products.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Referencia</th>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Categoría</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Precio</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-500">#{product.id}</td>
                  <td className="px-4 py-3 text-slate-700">{product.referencia}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{product.nombre}</td>
                  <td className="px-4 py-3">{product.categoria}</td>
                  <td className="px-4 py-3">{product.cantidad_stock}</td>
                  <td className="px-4 py-3">${Number(product.precio_unitario || 0).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => startEditing(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                      >
                        <Pencil className="size-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleToggleProduct(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        <Power className="size-3" />
                        {product.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleDeleteProduct(product.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 className="size-3" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
