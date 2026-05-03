# Guía de Registro - Validaciones Requeridas

## ¿Por qué recibes error 422?

El error **422 (Unprocessable Content)** significa que los datos que envías no cumplen con las validaciones del servidor.

## Validaciones Obligatorias

Cuando registres un usuario, debes enviar:

### 1. **Email** (emailValido)
- ✅ Debe ser un email válido
- ✅ Formato: `usuario@dominio.com`
- ❌ NO: `usuario` (falta @)
- ❌ NO: `usuario@` (falta dominio)
- ❌ NO: `usuario@.com` (falta nombre de dominio)

**Ejemplos válidos:**
```
juan@example.com
maria@gmail.com
admin@mitienda.com
```

### 2. **Contraseña** (password)
- ✅ Mínimo 8 caracteres
- ✅ Máximo 200 caracteres
- ❌ NO: `123` (solo 3 caracteres)
- ❌ NO: `pass` (solo 4 caracteres)

**Ejemplos válidos:**
```
password123
miContraseña2024
SecurePass@123
```

### 3. **Nombre Completo** (full_name)
- ✅ Mínimo 2 caracteres
- ✅ Máximo 200 caracteres
- ❌ NO: `A` (solo 1 carácter)
- ❌ NO: vacío

**Ejemplos válidos:**
```
Juan Pérez
María García López
José Andrés
```

### 4. **Role** (rol)
- ✅ Para registro público: `"usuario"` (por defecto)
- ❌ NO: `"administrador"` (solo admin puede crear)

## Cómo Registrarse Correctamente

### Desde el Navegador
1. Ve a la página de Login
2. Haz clic en la pestaña "Registrarse"
3. Completa:
   - **Email**: debe ser válido (ej: tu@email.com)
   - **Contraseña**: mínimo 8 caracteres
   - **Confirmar Contraseña**: debe ser igual
   - **Nombre Completo**: al menos 2 caracteres (ej: Juan Pérez)
4. Haz clic en "Registrarse"

### Desde cURL (terminal)
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123",
    "full_name": "Juan Pérez",
    "role": "usuario"
  }'
```

### Desde Python
```python
import requests

response = requests.post(
    "http://localhost:8000/auth/register",
    json={
        "email": "usuario@example.com",
        "password": "password123",
        "full_name": "Juan Pérez",
        "role": "usuario"
    }
)

print(response.status_code)  # Debe ser 201
print(response.json())
```

## Checklist de Validación

Antes de registrarte, verifica:

- [ ] ¿El email tiene formato válido? (contiene @)
- [ ] ¿La contraseña tiene al menos 8 caracteres?
- [ ] ¿El nombre tiene al menos 2 caracteres?
- [ ] ¿Ambas contraseñas coinciden?
- [ ] ¿El email no está registrado ya?

## Crear Usuarios de Prueba

Para probar el flujo de pedidos, crea varios usuarios:

```
Usuario 1 (Cliente):
- Email: cliente1@test.com
- Contraseña: cliente123
- Nombre: Cliente Uno

Usuario 2 (Cliente):
- Email: cliente2@test.com
- Contraseña: cliente123
- Nombre: Cliente Dos

Usuario 3 (Cliente):
- Email: cliente3@test.com
- Contraseña: cliente123
- Nombre: Cliente Tres
```

## Para Crear un Admin

Los usuarios normales NO pueden registrarse como administradores. Debes:

1. Registrarte como usuario normal
2. Pedir a otro admin que actualice tu rol en la base de datos, O
3. Actualizar directamente en la BD:

```sql
UPDATE users SET role = 'administrador' WHERE email = 'tu@email.com';
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 422 | Email inválido | Usa formato válido: usuario@dominio.com |
| 422 | Contraseña muy corta | Mínimo 8 caracteres |
| 422 | Nombre muy corto | Mínimo 2 caracteres |
| 422 | Campo faltante | Completa todos los campos |
| 401 | Email ya existe | Usa otro email |
| 403 | Intentas role admin | Solo admin puede crear admin |

