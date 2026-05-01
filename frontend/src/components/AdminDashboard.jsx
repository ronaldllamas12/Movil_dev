import { FileText, Loader2, Mail, Pencil, Plus, Power, Settings2, Shield, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCartTaxSettings, updateCartTaxSettings } from '../api/services/cartService';
import { downloadOrderInvoice, getAllOrders, sendOrderInvoice, updateOrderStatus } from '../api/services/ordersService';
import {
  createProduct,
  deleteProduct,
  getProducts,
  toggleProductStatus,
  updateProduct,
  uploadProductImage,
} from '../api/services/productsService';
import { useCarrito } from '../context/CarritoContext';
import Sidebar from './Sidebar';

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
  is_featured: false,
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
  is_featured: false,
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
    is_featured: form.is_featured,
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
    is_featured: Boolean(product.is_featured),
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

      <label className="md:col-span-2 lg:col-span-3 inline-flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-sm text-indigo-800">
        <input
          type="checkbox"
          name="is_featured"
          checked={form.is_featured}
          onChange={onChange}
          className="size-4"
        />
        Mostrar en Hero como producto destacado
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
  const [isUploadingCreateImage, setIsUploadingCreateImage] = useState(false);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  const [taxRateInput, setTaxRateInput] = useState(String(cartSettings.taxRate));
  const [selectedDiscountReference, setSelectedDiscountReference] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState('');

  const [selectedModule, setSelectedModule] = useState('carrito');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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

  useEffect(() => {
    if (!isAdmin || selectedModule !== 'pedidos') {
      return;
    }

    const loadOrders = async () => {
      setOrdersLoading(true);
      setErrorMsg('');

      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (error) {
        setErrorMsg(error?.response?.data?.detail || 'No se pudieron cargar las órdenes.');
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [isAdmin, selectedModule]);

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

  const uploadImageAndSetForm = async ({ file, setForm, setUploading, persistImageUrl }) => {
    if (!file) {
      return;
    }

    setUploading(true);
    resetMessages();

    try {
      const uploaded = await uploadProductImage(file);
      const imageUrl = String(uploaded?.url || '').trim();

      if (!imageUrl) {
        setErrorMsg('Cloudinary no devolvió una URL válida para la imagen.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        imagen_url: imageUrl,
      }));

      if (persistImageUrl) {
        await persistImageUrl(imageUrl);
        setSuccessMsg('Imagen subida a Cloudinary y guardada automáticamente en la base de datos.');
        return;
      }

      setSuccessMsg('Imagen subida correctamente a Cloudinary.');
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo subir la imagen a Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateImageUpload = async (event) => {
    const file = event.target.files?.[0];
    await uploadImageAndSetForm({
      file,
      setForm: setCreateForm,
      setUploading: setIsUploadingCreateImage,
    });
    event.target.value = '';
  };

  const handleEditImageUpload = async (event) => {
    const file = event.target.files?.[0];

    const persistEditImageUrl = async (imageUrl) => {
      if (!editingId) {
        return;
      }

      const updated = await updateProduct(editingId, {
        imagen_url: imageUrl,
      });

      setProducts((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      setEditForm(productToEditForm(updated));
    };

    await uploadImageAndSetForm({
      file,
      setForm: setEditForm,
      setUploading: setIsUploadingEditImage,
      persistImageUrl: persistEditImageUrl,
    });
    event.target.value = '';
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

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    resetMessages();
    setIsSaving(true);

    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
      setSuccessMsg('Estado de la orden actualizado correctamente.');
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo actualizar el estado de la orden.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOrderDetails = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleDownloadInvoice = async (orderId) => {
    resetMessages();
    try {
      await downloadOrderInvoice(orderId);
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo abrir la factura PDF.');
    }
  };

  const handleSendInvoice = async (orderId) => {
    resetMessages();
    setIsSaving(true);

    try {
      const updatedOrder = await sendOrderInvoice(orderId);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
      setSuccessMsg(`Factura enviada a ${updatedOrder.invoice_email_sent_to || updatedOrder.customer_email}.`);
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'No se pudo enviar la factura. Revisa Mailtrap y el correo del cliente.');
    } finally {
      setIsSaving(false);
    }
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
    <div className="flex max-w-7xl mx-auto px-2 py-10 gap-6">
      <Sidebar selected={selectedModule} onSelect={setSelectedModule} />
      <main className="flex-1 space-y-6">
        <header className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-cyan-50 p-6">
          <div className="flex items-center gap-3 text-indigo-700 mb-2">
            <Shield className="size-5" />
            <p className="font-semibold">Panel de administración</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard de administración MOVIL-DEV</h1>
          <p className="text-slate-600 mt-1">Gestiona inventario, estado, IVA del carrito y descuentos por referencia.</p>
        </header>

        {errorMsg ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
        ) : null}
        {successMsg ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
        ) : null}

        {selectedModule === 'carrito' && (
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
        )}

        {selectedModule === 'productos' && (
          <>
            <form onSubmit={handleCreateProduct} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Plus className="size-4" />
                Crear producto
              </div>
              <ProductFields form={createForm} onChange={handleFormInput(setCreateForm)} />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-800">Subir imagen de producto a Cloudinary</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCreateImageUpload}
                  disabled={isSaving || isUploadingCreateImage}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                {isUploadingCreateImage ? (
                  <p className="text-sm text-slate-600 inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Subiendo imagen...
                  </p>
                ) : null}
                {createForm.imagen_url ? (
                  <p className="text-xs text-emerald-700 break-all">URL guardada automáticamente: {createForm.imagen_url}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSaving || isUploadingCreateImage}
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

                <div className="rounded-2xl border border-blue-200 bg-white p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-800">Subir nueva imagen a Cloudinary</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    disabled={isSaving || isUploadingEditImage}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  {isUploadingEditImage ? (
                    <p className="text-sm text-slate-600 inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Subiendo imagen...
                    </p>
                  ) : null}
                  {editForm.imagen_url ? (
                    <p className="text-xs text-emerald-700 break-all">URL guardada automáticamente: {editForm.imagen_url}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSaving || isUploadingEditImage}
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
                      <th className="text-left px-4 py-3">Hero</th>
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
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${product.is_featured ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                            {product.is_featured ? 'Destacado' : 'Normal'}
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
          </>
        )}

        {selectedModule === 'pedidos' && (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800">Pedidos ({orders.length})</h2>
              </div>

              {ordersLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="size-5 animate-spin mx-auto mb-2" />
                  Cargando pedidos...
                </div>
              ) : orders.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-500">No hay pedidos registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">Usuario</th>
                        <th className="text-left px-4 py-3">Fecha</th>
                        <th className="text-left px-4 py-3">Estado</th>
                        <th className="text-left px-4 py-3">Subtotal</th>
                        <th className="text-left px-4 py-3">Impuestos</th>
                        <th className="text-left px-4 py-3">Total</th>
                        <th className="text-left px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <React.Fragment key={`order-group-${order.id}`}>
                          <tr key={`order-${order.id}`} className="border-t border-slate-100">
                            <td className="px-4 py-3 text-slate-500">#{order.id}</td>
                            <td className="px-4 py-3 text-slate-700">Usuario #{order.user_id}</td>
                            <td className="px-4 py-3 text-slate-700">
                              {new Date(order.created_at).toLocaleDateString('es-CO')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {order.status === 'pending' ? 'Pendiente' :
                                 order.status === 'paid' ? 'Pago exitoso' :
                                 order.status === 'shipped' ? 'Enviado' :
                                 order.status === 'cancelled' ? 'Cancelado' :
                                 order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">${Number(order.subtotal || 0).toLocaleString('es-CO')}</td>
                            <td className="px-4 py-3">${Number(order.tax || 0).toLocaleString('es-CO')}</td>
                            <td className="px-4 py-3 font-semibold">${Number(order.total || 0).toLocaleString('es-CO')}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleToggleOrderDetails(order.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                >
                                  {expandedOrderId === order.id ? 'Ocultar detalles' : 'Ver detalles'}
                                </button>
                                {order.status === 'pending' && (
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                  >
                                    Marcar Pagado
                                  </button>
                                )}
                                {order.status === 'paid' && (
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-3 py-1.5 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                                  >
                                    Marcar enviado
                                  </button>
                                )}
                                {order.status === 'paid' && (
                                  <button
                                    type="button"
                                    disabled={isSaving || !order.customer_email}
                                    onClick={() => handleSendInvoice(order.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                  >
                                    <Mail className="size-3" />
                                    Enviar factura
                                  </button>
                                )}
                                {order.status !== 'cancelled' && order.status !== 'shipped' && (
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-60"
                                  >
                                    Cancelar
                                  </button>
                                )}
                                {order.invoice_pdf_path && (
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleDownloadInvoice(order.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                  >
                                    <FileText className="size-3" />
                                    Factura
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedOrderId === order.id ? (
                            <tr key={`details-${order.id}`} className="bg-slate-50">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                                  <div>
                                    <h3 className="font-semibold text-slate-800 mb-3">Datos de factura</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                      <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Receptor</p>
                                        <p className="text-slate-800">{order.customer_name || 'No registrado'}</p>
                                        <p className="text-slate-600 break-all">{order.customer_email || 'Sin correo de factura'}</p>
                                      </div>
                                      <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Entrega</p>
                                        <p className="text-slate-800">{order.delivery_address || 'No registrada'}</p>
                                        <p className="text-slate-600">{order.delivery_city || ''}</p>
                                      </div>
                                      <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Pago</p>
                                        <p className="text-slate-800">{order.payment_provider || 'No registrado'}</p>
                                        <p className="text-slate-600">{order.payment_method || 'No registrado'}</p>
                                      </div>
                                      <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Factura PDF</p>
                                        <p className="text-slate-800">{order.invoice_pdf_path ? 'Generada' : 'No generada'}</p>
                                        {order.invoice_pdf_path ? (
                                          <button
                                            type="button"
                                            onClick={() => handleDownloadInvoice(order.id)}
                                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                                          >
                                            <FileText className="size-3" />
                                            Ver PDF
                                          </button>
                                        ) : null}
                                      </div>
                                      <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Envio por correo</p>
                                        <p className="text-slate-800 break-all">{order.invoice_email_sent_to || 'Pendiente'}</p>
                                        <p className="text-slate-600">
                                          {order.invoice_email_sent_at
                                            ? new Date(order.invoice_email_sent_at).toLocaleString('es-CO')
                                            : 'Sin fecha de envio'}
                                        </p>
                                        {order.status === 'paid' ? (
                                          <button
                                            type="button"
                                            disabled={isSaving || !order.customer_email}
                                            onClick={() => handleSendInvoice(order.id)}
                                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-60"
                                          >
                                            <Mail className="size-3" />
                                            Enviar factura
                                          </button>
                                        ) : null}
                                      </div>
                                      <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Pago confirmado</p>
                                        <p className="text-slate-800">
                                          {order.paid_at ? new Date(order.paid_at).toLocaleString('es-CO') : 'Pendiente'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold text-slate-800 mb-3">Items de la orden</h3>
                                  {order.items?.length ? (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full text-sm">
                                        <thead className="bg-slate-100 text-slate-600">
                                          <tr>
                                            <th className="text-left px-3 py-2">Producto ID</th>
                                            <th className="text-left px-3 py-2">Cantidad</th>
                                            <th className="text-left px-3 py-2">Precio unitario</th>
                                            <th className="text-left px-3 py-2">Total</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {order.items.map((item) => (
                                            <tr key={item.id} className="border-t border-slate-100">
                                              <td className="px-3 py-2 text-slate-700">{item.product_id}</td>
                                              <td className="px-3 py-2">{item.quantity}</td>
                                              <td className="px-3 py-2">${Number(item.price || 0).toLocaleString('es-CO')}</td>
                                              <td className="px-3 py-2">${Number((item.price || 0) * item.quantity).toLocaleString('es-CO')}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-500">No hay items registrados para esta orden.</p>
                                  )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
