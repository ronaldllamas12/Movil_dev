import { Loader2, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    createProduct,
    deleteProduct,
    getProducts,
    toggleProductStatus,
    updateProduct,
    uploadProductImage,
} from '../../api/services/productsService';
import ProductFields from './ProductFormFields';
import { BASE_CREATE_FORM, BASE_EDIT_FORM, productToEditForm, toPayload } from './productFormConfig';

export default function ProductsPanel() {
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

  const visibleProducts = useMemo(() => products.slice(0, 100), [products]);

  useEffect(() => {
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
  }, []);

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
        setErrorMsg('Cloudinary no devolvio una URL valida para la imagen.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        imagen_url: imageUrl,
      }));

      if (persistImageUrl) {
        await persistImageUrl(imageUrl);
        setSuccessMsg('Imagen subida a Cloudinary y guardada automaticamente en la base de datos.');
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

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 flex items-center gap-3">
        <Loader2 className="size-5 animate-spin" />
        Cargando productos...
      </section>
    );
  }

  return (
    <>
      {errorMsg ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}
      {successMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</div>
      ) : null}

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
            <p className="text-xs text-emerald-700 break-all">URL guardada automaticamente: {createForm.imagen_url}</p>
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
              Cancelar edicion
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
              <p className="text-xs text-emerald-700 break-all">URL guardada automaticamente: {editForm.imagen_url}</p>
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
                <th className="text-left px-4 py-3">Categoria</th>
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
  );
}
