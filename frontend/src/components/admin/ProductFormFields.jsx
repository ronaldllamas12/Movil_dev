import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_OPTIONS } from './productFormConfig';

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

function ColorVariantsEditor({ variants = [], onVariantsChange, onVariantImageUpload }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const handleFieldChange = (index, field, value) => {
    const updated = variants.map((variant, idx) => {
      if (idx !== index) {
        return variant;
      }

      if (field === 'stock') {
        return { ...variant, stock: Math.max(0, Number(value) || 0) };
      }

      if (field === 'image_url') {
        return { ...variant, image_url: value || null };
      }

      return { ...variant, [field]: value };
    });

    onVariantsChange?.(updated);
  };

  const handleAdd = () => {
    onVariantsChange?.([...(variants || []), { color: '', stock: 0, image_url: null }]);
  };

  const handleRemove = (index) => {
    onVariantsChange?.((variants || []).filter((_, idx) => idx !== index));
  };

  const handleImageUpload = async (index, file) => {
    if (!file || !onVariantImageUpload) {
      return;
    }

    setUploadingIndex(index);
    try {
      const imageUrl = await onVariantImageUpload(file);
      if (imageUrl) {
        handleFieldChange(index, 'image_url', imageUrl);
      }
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-slate-700">Variantes por color</span>

      {variants.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          Sin variantes. Si agregas colores con imagen y stock, el stock total se calcula automaticamente.
        </p>
      ) : null}

      {variants.map((variant, index) => (
        <div
          key={`${variant.color || 'nuevo'}-${index}`}
          className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <input
            type="text"
            placeholder="Color (ej: Negro)"
            value={variant.color || ''}
            onChange={(event) => handleFieldChange(index, 'color', event.target.value)}
            className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">Stock:</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={variant.stock ?? 0}
              onChange={(event) => handleFieldChange(index, 'stock', event.target.value)}
              className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            />
          </div>

          <input
            type="text"
            placeholder="URL de imagen (opcional)"
            value={variant.image_url || ''}
            onChange={(event) => handleFieldChange(index, 'image_url', event.target.value)}
            className="min-w-44 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />

          {variant.image_url ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-2 py-1.5">
              <img
                src={variant.image_url}
                alt={variant.color || `Variante ${index + 1}`}
                className="size-12 rounded-md border border-slate-200 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <span className="max-w-36 text-xs text-emerald-700">
                Esta imagen se mostrara al seleccionar {variant.color || 'este color'}.
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Sin imagen para esta variante. Si el cliente elige este color, vera la imagen principal del producto.
            </span>
          )}

          <label
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
              uploadingIndex === index
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            {uploadingIndex === index ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Plus className="size-3" />
                Subir imagen
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingIndex !== null}
              onChange={(event) => handleImageUpload(index, event.target.files?.[0])}
            />
          </label>

          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
            title="Eliminar variante"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-2 self-start rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="size-4" />
        Agregar color
      </button>
    </div>
  );
}

export default function ProductFields({ form, onChange, onVariantsChange, onVariantImageUpload }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <FormInput label="Marca" name="marca" value={form.marca} onChange={onChange} required placeholder="Ej: Apple" />
      <FormInput label="Referencia" name="referencia" value={form.referencia} onChange={onChange} required placeholder="Ej: APL-IP15PM-256" />
      <FormInput label="Nombre" name="nombre" value={form.nombre} onChange={onChange} required placeholder="Ej: iPhone 15 Pro Max" />

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Categoria
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
        label="Descripcion breve"
        name="descripcion_breve"
        value={form.descripcion_breve}
        onChange={onChange}
        required
        placeholder="Resumen corto del equipo"
      />

      <FormInput label="Memoria RAM" name="tamano_memoria_ram" value={form.tamano_memoria_ram} onChange={onChange} required placeholder="Ej: 8 GB" />
      <FormInput label="Almacenamiento ROM" name="rom" value={form.rom} onChange={onChange} required placeholder="Ej: 256 GB" />
      <FormInput
        label="Garantia (meses)"
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

      <div className="md:col-span-2 lg:col-span-3">
        <ColorVariantsEditor
          variants={Array.isArray(form.color_variants) ? form.color_variants : []}
          onVariantsChange={onVariantsChange}
          onVariantImageUpload={onVariantImageUpload}
        />
      </div>

      <FormInput label="Conectividad" name="conectividad" value={form.conectividad} onChange={onChange} required placeholder="Ej: 5G, Wi-Fi 6, Bluetooth 5.3" />
      <FormInput label="Procesador" name="procesador" value={form.procesador} onChange={onChange} required placeholder="Ej: Snapdragon 8 Gen 3" />
      <FormInput label="Dimensiones" name="dimensiones" value={form.dimensiones} onChange={onChange} required placeholder="Ej: 162 x 75 x 8 mm" />

      <FormInput label="Bateria" name="bateria" value={form.bateria} onChange={onChange} required placeholder="Ej: 5000 mAh" />
      <FormInput
        label="Camara principal"
        name="resolucion_camara_principal"
        value={form.resolucion_camara_principal}
        onChange={onChange}
        required
        placeholder="Ej: 50 MP"
      />
      <FormInput
        label="Camara frontal"
        name="resolucion_camara_frontal"
        value={form.resolucion_camara_frontal}
        onChange={onChange}
        required
        placeholder="Ej: 32 MP"
      />

      <FormInput
        label="Carga rapida"
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
