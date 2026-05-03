import {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeWASocket,
    useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import express from "express";
import fs from "fs";
import path from "path";
import pino from "pino";
import QRCode from "qrcode";

// ── Config ──
const PORT = process.env.WA_SERVICE_PORT || 3001;
const AUTH_DIR = path.resolve(process.env.WA_AUTH_DIR || ".baileys_auth");
const logger = pino({ level: "silent" });
const RECONNECT_DELAY_MS = Number(process.env.WA_RECONNECT_DELAY_MS || 3000);
const MAX_RETRIES = Number(process.env.WA_MAX_RETRIES || 20);
const RESET_SESSION_ON_LOGOUT = process.env.WA_RESET_SESSION_ON_LOGOUT === "true";
const WATCHDOG_INTERVAL_MS = Number(process.env.WA_WATCHDOG_INTERVAL_MS || 15000);
const CONNECT_TIMEOUT_MS = Number(process.env.WA_CONNECT_TIMEOUT_MS || 60000);
const KEEP_ALIVE_INTERVAL_MS = Number(process.env.WA_KEEPALIVE_INTERVAL_MS || 20000);

// ── Estado interno ──
let sock = null;
let waReady = false;
let waQR = null;
let connecting = false;
let retryCount = 0;
let intentionalDisconnect = false;
let watchdogTimer = null;
let lastConnectionEventAt = 0;
let lastDisconnectReason = null;

// ── Mensajes por estado de pedido ──
const STATUS_MESSAGES = {
  paid: (order) =>
    [
      `✅ *¡Tu pago ha sido confirmado!*`,
      ``,
      `Hola ${order.customer_name || "cliente"}, tu pedido *#${order.order_id}* ha sido pagado exitosamente.`,
      `💰 Total: $${formatMoney(order.total)}`,
      formatProducts(order.product_names),
      ``,
      `Pronto comenzaremos a prepararlo. 🛍️`,
      ``,
      `_Movil Dev_`,
    ]
      .filter((l) => l !== null)
      .join("\n"),

  processing: (order) =>
    [
      `⚙️ *Pedido en preparación*`,
      ``,
      `Hola ${order.customer_name || "cliente"}, tu pedido *#${order.order_id}* está siendo preparado con cuidado.`,
      formatProducts(order.product_names),
      ``,
      `Te avisaremos cuando sea enviado. 📦`,
      ``,
      `_Movil Dev_`,
    ]
      .filter((l) => l !== null)
      .join("\n"),

  shipped: (order) =>
    [
      `🚚 *¡Tu pedido fue enviado!*`,
      ``,
      `Hola ${order.customer_name || "cliente"}, tu pedido *#${order.order_id}* está en camino.`,
      formatProducts(order.product_names),
      order.address ? `📍 Dirección: ${order.address}` : null,
      ``,
      `¡Pronto lo recibirás! 🎁`,
      ``,
      `_Movil Dev_`,
    ]
      .filter((l) => l !== null)
      .join("\n"),

  delivered: (order) =>
    [
      `🎉 *¡Pedido entregado!*`,
      ``,
      `Hola ${order.customer_name || "cliente"}, tu pedido *#${order.order_id}* ha sido entregado.`,
      formatProducts(order.product_names),
      ``,
      `Gracias por comprar con nosotros. ¡Esperamos verte pronto! 🙌`,
      ``,
      `_Movil Dev_`,
    ]
      .filter((l) => l !== null)
      .join("\n"),

  cancelled: (order) =>
    [
      `❌ *Pedido cancelado*`,
      ``,
      `Hola ${order.customer_name || "cliente"}, tu pedido *#${order.order_id}* ha sido cancelado.`,
      formatProducts(order.product_names),
      ``,
      `Si tienes dudas contáctanos por este chat. 😊`,
      ``,
      `_Movil Dev_`,
    ]
      .filter((l) => l !== null)
      .join("\n"),

  refunded: (order) =>
    [
      `↩️ *Reembolso procesado*`,
      ``,
      `Hola ${order.customer_name || "cliente"}, se ha procesado un reembolso para tu pedido *#${order.order_id}*.`,
      formatProducts(order.product_names),
      `El monto será acreditado en tu método de pago original.`,
      ``,
      `_Movil Dev_`,
    ]
      .filter((l) => l !== null)
      .join("\n"),
};

// ── Utilidades ──
function formatMoney(value) {
  if (!value) return "0";
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatProducts(productNames) {
  if (!Array.isArray(productNames) || productNames.length === 0) {
    return null;
  }

  return ["🧾 Productos:", ...productNames.map((name) => `• ${name}`)].join("\n");
}

/** Normaliza teléfono colombiano a JID: 573001234567@s.whatsapp.net */
function toJid(phone) {
  const digits = phone.replace(/[^0-9]/g, "");
  // Si ya tiene código de país 57 (12 dígitos)
  if (digits.startsWith("57") && digits.length === 12) {
    return `${digits}@s.whatsapp.net`;
  }
  // Número local de 10 dígitos
  if (digits.length === 10) {
    return `57${digits}@s.whatsapp.net`;
  }
  // Devolver tal cual con @s.whatsapp.net
  return `${digits}@s.whatsapp.net`;
}

// ── Gestión de sesión ──
function clearAuthDir() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      console.log("[WhatsApp] Datos de sesion eliminados.");
    }
  } catch {
    /* ignore */
  }
}

function getAuthDirDiagnostics() {
  try {
    const exists = fs.existsSync(AUTH_DIR);
    const files = exists ? fs.readdirSync(AUTH_DIR) : [];

    return {
      authDir: AUTH_DIR,
      authDirExists: exists,
      authFileCount: files.length,
    };
  } catch (error) {
    return {
      authDir: AUTH_DIR,
      authDirExists: false,
      authFileCount: 0,
      authDirError: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getWhatsAppStatus() {
  return { ready: waReady, qr: waQR, connecting, lastConnectionEventAt };
}

function markConnectionEvent() {
  lastConnectionEventAt = Date.now();
}

async function disconnectWhatsApp() {
  intentionalDisconnect = true;
  if (sock) {
    try {
      await sock.logout();
      sock = null;
      waReady = false;
      waQR = null;
      connecting = false;
      clearAuthDir();
      console.log("[WhatsApp] Desconectado por admin.");
    } catch (err) {
      console.error("[WhatsApp] Error al desconectar:", err);
      sock = null;
      waReady = false;
    } finally {
      connecting = false;
    }
  }
}

function scheduleReconnect(reason = "unknown") {
  if (intentionalDisconnect) {
    console.log("[WhatsApp] Reconexion omitida por desconexion intencional.");
    return;
  }

  if (retryCount >= MAX_RETRIES) {
    console.error(
      `[WhatsApp] Maximo de reintentos alcanzado (${MAX_RETRIES}). Ultima causa: ${reason}`
    );
    return;
  }

  retryCount += 1;
  console.log(
    `[WhatsApp] Reintentando conexion (${retryCount}/${MAX_RETRIES}). Causa: ${reason}`
  );
  setTimeout(() => initWhatsApp(), RECONNECT_DELAY_MS);
}

function startWatchdog() {
  if (watchdogTimer) return;

  watchdogTimer = setInterval(() => {
    if (intentionalDisconnect) return;

    const wsState = sock?.ws?.readyState;
    const looksDead = sock && wsState !== undefined && wsState !== 1;

    if (looksDead) {
      console.log(`[WhatsApp] Watchdog detecto socket no abierto (state=${wsState}). Reiniciando...`);
      waReady = false;
      connecting = false;
      sock = null;
      scheduleReconnect(`watchdog-ws-state:${wsState}`);
      return;
    }

    if (!sock && !waReady && !connecting) {
      console.log("[WhatsApp] Watchdog detecto servicio sin socket activo. Reconectando...");
      scheduleReconnect("watchdog-missing-socket");
      return;
    }

    const staleThreshold = Math.max(WATCHDOG_INTERVAL_MS * 3, 45000);
    const isStale = lastConnectionEventAt && Date.now() - lastConnectionEventAt > staleThreshold;

    if (isStale && !connecting && !waQR) {
      console.log("[WhatsApp] Watchdog detecto conexion sin eventos recientes. Reiniciando socket...");
      waReady = false;
      sock = null;
      scheduleReconnect("watchdog-stale-connection");
    }
  }, WATCHDOG_INTERVAL_MS);
}

async function initWhatsApp() {
  if (connecting || waReady) return;
  intentionalDisconnect = false;
  connecting = true;
  markConnectionEvent();
  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log("[WhatsApp] Usando WA Web version:", version);
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      logger,
      version,
      browser: ["MovilDev", "Chrome", "1.0.0"],
      connectTimeoutMs: CONNECT_TIMEOUT_MS,
      keepAliveIntervalMs: KEEP_ALIVE_INTERVAL_MS,
      markOnlineOnConnect: true,
      syncFullHistory: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      markConnectionEvent();
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        waQR = qr;
        waReady = false;
        console.log(
          "[WhatsApp] QR generado — escanea desde GET /api/whatsapp/qr"
        );
      }

      if (connection === "close") {
        sock = null;
        waReady = false;
        connecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const isRestartRequired = statusCode === DisconnectReason.restartRequired;
        const isTransientClose = !loggedOut && !intentionalDisconnect;

        lastDisconnectReason = {
          connection,
          statusCode: statusCode ?? null,
          loggedOut,
          isRestartRequired,
          intentionalDisconnect,
          at: new Date().toISOString(),
        };

        if (intentionalDisconnect) {
          console.log("[WhatsApp] Conexion cerrada por solicitud del administrador.");
          return;
        }

        if (loggedOut) {
          waQR = null;
          if (RESET_SESSION_ON_LOGOUT) {
            clearAuthDir();
          }
          scheduleReconnect(`loggedOut:${statusCode ?? "unknown"}`);
          return;
        }

        if (isRestartRequired) {
          console.log("[WhatsApp] WhatsApp solicito reinicio de sesion. Reconectando...");
          scheduleReconnect(`restartRequired:${statusCode}`);
          return;
        }

        if (isTransientClose) {
          console.log("[WhatsApp] Desconexion transitoria. Reconectando sin borrar sesion...");
          scheduleReconnect(`transient:${statusCode ?? "unknown"}`);
        }
      }

      if (connection === "open") {
        waReady = true;
        waQR = null;
        connecting = false;
        retryCount = 0;
        lastDisconnectReason = null;
        console.log("[WhatsApp] Conectado y listo para enviar mensajes.");
      }
    });

    sock.ev.on("messages.upsert", () => {
      markConnectionEvent();
    });
  } catch (err) {
    sock = null;
    connecting = false;
    markConnectionEvent();
    console.error("[WhatsApp] Error al inicializar:", err);
    scheduleReconnect("init-error");
  }
}

// ── Envío de mensajes ──
async function sendMessage(phone, body) {
  if (!sock || !waReady) {
    console.log(
      "[WhatsApp DEMO] No conectado. Mensaje que se enviaria a",
      phone
    );
    console.log(body);
    return false;
  }
  try {
    const jid = toJid(phone);
    await sock.sendMessage(jid, { text: body });
    console.log("[WhatsApp] Mensaje enviado a", phone);
    return true;
  } catch (err) {
    console.error("[WhatsApp ERROR]", err);
    return false;
  }
}

// ── Servidor HTTP ──
const app = express();
app.use(express.json());

/** GET /api/whatsapp/status — estado de conexión */
app.get("/api/whatsapp/status", (_req, res) => {
  const authDiagnostics = getAuthDirDiagnostics();

  res.json({
    ready: waReady,
    hasQR: !!waQR,
    connecting,
    lastConnectionEventAt,
    retryCount,
    lastDisconnectReason,
    ...authDiagnostics,
  });
});

/** GET /api/whatsapp/qr — imagen QR para escanear */
app.get("/api/whatsapp/qr", async (_req, res) => {
  if (!waQR) {
    return res
      .status(404)
      .json({ error: "No hay QR disponible. Ya esta conectado o aun cargando." });
  }
  try {
    const dataUrl = await QRCode.toDataURL(waQR);
    const base64 = dataUrl.replace("data:image/png;base64,", "");
    const buf = Buffer.from(base64, "base64");
    res.setHeader("Content-Type", "image/png");
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: "Error generando QR" });
  }
});

/**
 * POST /api/whatsapp/send-order-status
 * Body: { phone, order_id, status, total?, address?, customer_name?, product_names? }
 */
app.post("/api/whatsapp/send-order-status", async (req, res) => {
  const { phone, order_id, status, total, address, customer_name, product_names } = req.body;

  if (!phone || !order_id || !status) {
    return res.status(400).json({ error: "Faltan campos: phone, order_id, status" });
  }

  const template = STATUS_MESSAGES[status];
  if (!template) {
    return res
      .status(400)
      .json({ error: `Estado '${status}' no tiene mensaje definido.` });
  }

  const body = template({ order_id, total, address, customer_name, product_names });
  const sent = await sendMessage(phone, body);

  res.json({ sent, status, order_id });
});

/** POST /api/whatsapp/connect — inicia conexión */
app.post("/api/whatsapp/connect", async (_req, res) => {
  if (connecting || waReady) {
    return res.json({ status: "already_connecting_or_connected", ready: waReady });
  }
  initWhatsApp();
  res.json({ status: "connecting", ready: waReady });
});

/** POST /api/whatsapp/disconnect — termina conexión */
app.post("/api/whatsapp/disconnect", async (req, res) => {
  await disconnectWhatsApp();
  res.json({ status: "disconnected", ready: waReady });
});

// ── Arranque ──
const shouldAutoInit = process.env.WA_AUTO_INIT !== "false";
app.listen(PORT, () => {
  console.log(`[WhatsApp Service] Escuchando en http://localhost:${PORT}`);
  startWatchdog();
  if (shouldAutoInit) {
    console.log("[WhatsApp] Auto-iniciando conexión...");
    initWhatsApp();
  } else {
    console.log("[WhatsApp] Auto-init deshabilitado. Usa POST /api/whatsapp/connect para conectar.");
  }
});
