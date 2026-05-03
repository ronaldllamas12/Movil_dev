# Deployment de WhatsApp Service

## Descripción

Este microservicio WhatsApp (basado en Baileys) debe desplegarse en una plataforma con proceso persistente y disco persistente si quieres evitar desconexiones frecuentes. Render es una buena opción si lo despliegas como servicio separado del backend.

## Opción recomendada: Render

Ya quedó preparado un blueprint en [whatsapp-service/render.yaml](whatsapp-service/render.yaml).

### Qué debes hacer en Render

1. Crea un nuevo Web Service apuntando a la carpeta `whatsapp-service`.
2. Usa el archivo `render.yaml` o replica esa configuración manualmente.
3. Asegúrate de que el servicio tenga disco persistente montado en `/var/data`.
4. Mantén estas variables:

```env
NODE_ENV=production
WA_SERVICE_PORT=3001
WA_AUTO_INIT=true
WA_RECONNECT_DELAY_MS=3000
WA_MAX_RETRIES=20
WA_RESET_SESSION_ON_LOGOUT=false
WA_AUTH_DIR=/var/data/baileys_auth
```

### Qué debes cambiar en tu backend desplegado en Render

En el servicio backend, configura:

```env
WA_SERVICE_URL=https://TU-SERVICIO-WHATSAPP.onrender.com
```

Con eso, el backend seguirá en Render como ahora, pero las conexiones de WhatsApp vivirán en otro servicio dedicado y persistente.

## Opción no recomendada: Vercel

## Requisitos previos

1. Cuenta de Vercel (gratis en vercel.com)
2. Código del repositorio en GitHub
3. Variables de entorno configuradas

## Pasos de deployment en Vercel

### 1. Conecta tu repositorio en Vercel

```bash
# O directamente en vercel.com:
# 1. Ve a https://vercel.com/new
# 2. Selecciona tu repositorio de GitHub
# 3. Selecciona la carpeta raíz: `whatsapp-service`
```

### 2. Configura variables de entorno en Vercel

En el dashboard de Vercel, ve a **Settings → Environment Variables** y agrega:

```
WA_SERVICE_PORT=3001
NODE_ENV=production
WA_AUTO_INIT=true
```

### 3. Deploy

Presiona **Deploy** en Vercel. Una vez completado, obtendrás una URL como:

```
https://your-project.vercel.app
```

### 4. Actualiza el backend

En tu `backend/.env`, cambia:

```
WA_SERVICE_URL=https://your-project.vercel.app
```

## Endpoints disponibles

- `GET /api/whatsapp/status` - Estado de conexión
- `GET /api/whatsapp/qr` - Imagen QR para escanear
- `POST /api/whatsapp/send-order-status` - Enviar notificación
- `POST /api/whatsapp/connect` - Conectar WhatsApp
- `POST /api/whatsapp/disconnect` - Desconectar WhatsApp

## Notas importantes

- **Persistencia real de sesión**: Las sesiones se guardan en `.baileys_auth/`. En Vercel, ese almacenamiento es efímero, por lo que la conexión puede perderse aunque el código reconecte bien. Si necesitas que WhatsApp no se desconecte, despliega este servicio en Railway, Render sin auto-sleep, VPS o Docker con disco persistente.
- **Modo demo**: Si no está conectado, aparecerá un QR en `GET /api/whatsapp/qr`.
- **Auto-init**: Configura `WA_AUTO_INIT=false` si no quieres que inicie automáticamente en el deployment.
- **Reconexión**: Puedes ajustar `WA_RECONNECT_DELAY_MS`, `WA_MAX_RETRIES` y `WA_RESET_SESSION_ON_LOGOUT`.

## Troubleshooting

### El QR no aparece

- Verifica que `WA_AUTO_INIT=true` esté en las variables de entorno
- Espera 10-15 segundos después del deploy para que inicialice

### La conexión se cae

- Si estás en Vercel, el problema es de plataforma: no mantiene bien sockets largos ni almacenamiento local persistente.
- Si estás local o en servidor persistente, el servicio ahora intenta reconectar sin borrar la sesión en cierres transitorios.
- Usa `WA_RESET_SESSION_ON_LOGOUT=true` solo si realmente quieres forzar limpieza de credenciales cuando WhatsApp invalide la sesión.

### ¿Cómo verifico los logs?

En Vercel dashboard → **Deployments → Logs** para ver la salida del servidor.

## Alternativa: Railway, Render o servidor propio

Si necesitas persistencia garantizada, considera:

- **Railway**: Railway.app (recomendado para Node.js)
- **Render**: Render.com (free tier con auto-sleep)
- **Servidor propio**: VPS en Digital Ocean, AWS Lightsail, etc.
