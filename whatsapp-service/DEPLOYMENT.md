# Deployment de WhatsApp Service en Vercel

## Descripción

Este microservicio WhatsApp (basado en Baileys) se puede desplegar en Vercel. Vercel ejecutará el servidor Node.js de forma serverless con funciones permanentes.

## Requisitos previos

1. Cuenta de Vercel (gratis en vercel.com)
2. Código del repositorio en GitHub
3. Variables de entorno configuradas

## Pasos de deployment

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

- **Almacenamiento de sesión**: Las sesiones se guardan en `.baileys_auth/`. En Vercel, esto es temporal (se limpia entre deploys). Para persistencia, necesitarías usar una base de datos o storage externo.
- **Modo demo**: Si no está conectado, aparecerá un QR en `GET /api/whatsapp/qr`.
- **Auto-init**: Configura `WA_AUTO_INIT=false` si no quieres que inicie automáticamente en el deployment.

## Troubleshooting

### El QR no aparece

- Verifica que `WA_AUTO_INIT=true` esté en las variables de entorno
- Espera 10-15 segundos después del deploy para que inicialice

### La conexión se cae

- Vercel puede reiniciar la función en cualquier momento. Usa los botones "Conectar/Desconectar" del panel admin para reintentar.

### ¿Cómo verifico los logs?

En Vercel dashboard → **Deployments → Logs** para ver la salida del servidor.

## Alternativa: Railway, Render o servidor propio

Si necesitas persistencia garantizada, considera:

- **Railway**: Railway.app (recomendado para Node.js)
- **Render**: Render.com (free tier con auto-sleep)
- **Servidor propio**: VPS en Digital Ocean, AWS Lightsail, etc.
