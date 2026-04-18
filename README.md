# Movil-Dev

## Cloudinary (subida de fotos)

Para guardar fotos (por ejemplo avatar de perfil) en Cloudinary, agrega estas variables en `.env`:

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

Luego instala dependencias y reinicia backend:

```
pip install -r requirements.txt
```

Endpoint disponible:

- `POST /auth/me/avatar` (requiere JWT en `Authorization` y archivo en campo `file`)
