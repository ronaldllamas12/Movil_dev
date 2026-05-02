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

export default function ProductFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
