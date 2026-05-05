import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function EpaycoCheckoutWindow() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Preparando checkout seguro...");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const isTestMode = searchParams.get("test") !== "0";

    if (!sessionId) {
      setError("No se recibio el identificador de sesion de ePayco.");
      return;
    }

    let disposed = false;
    let sdkPollTimer = null;

    const openCheckout = () => {
      if (disposed) return;

      try {
        const checkout = window.ePayco.checkout.configure({
          sessionId,
          type: "onpage",
          test: isTestMode,
        });

        checkout.onCreated?.(() => {
          if (!disposed) {
            setStatus("Checkout abierto. Completa tu pago en esta pestaña.");
          }
        });

        checkout.onErrors?.((providerError) => {
          console.error("Error ePayco:", providerError);
          if (!disposed) {
            setError("ePayco no pudo abrir el checkout. Intenta de nuevo desde la app.");
          }
        });

        checkout.onClosed?.(() => {
          if (!disposed) {
            setStatus("Ventana de pago cerrada. Puedes volver a la app principal.");
          }
        });

        checkout.open();
      } catch (checkoutError) {
        console.error("Error al abrir checkout ePayco:", checkoutError);
        if (!disposed) {
          setError("No fue posible abrir el checkout de ePayco.");
        }
      }
    };

    const waitForSdkReady = () =>
      new Promise((resolve, reject) => {
        const startedAt = Date.now();

        const probe = () => {
          if (disposed) {
            reject(new Error("cancelled"));
            return;
          }

          if (window.ePayco?.checkout) {
            resolve();
            return;
          }

          if (Date.now() - startedAt > 10000) {
            reject(new Error("timeout"));
            return;
          }

          sdkPollTimer = window.setTimeout(probe, 120);
        };

        probe();
      });

    const ensureScriptLoaded = () =>
      new Promise((resolve, reject) => {
        if (window.ePayco?.checkout) {
          resolve();
          return;
        }

        let script = document.getElementById("epayco-checkout-v2-script");
        if (!script) {
          script = document.createElement("script");
          script.id = "epayco-checkout-v2-script";
          script.src = "https://checkout.epayco.co/checkout-v2.js";
          script.async = true;
          document.body.appendChild(script);
        }

        const onLoad = () => resolve();
        const onError = () => reject(new Error("script-error"));

        script.addEventListener("load", onLoad, { once: true });
        script.addEventListener("error", onError, { once: true });
      });

    (async () => {
      try {
        setStatus("Inicializando ePayco...");
        await ensureScriptLoaded();
        await waitForSdkReady();
        if (disposed) return;
        openCheckout();
      } catch (sdkError) {
        if (disposed) return;
        if (sdkError?.message === "script-error") {
          setError("No se pudo cargar el script de ePayco.");
          return;
        }
        setError("No se pudo inicializar ePayco en esta ventana.");
      }
    })();

    return () => {
      disposed = true;
      if (sdkPollTimer) {
        window.clearTimeout(sdkPollTimer);
      }
    };
  }, [searchParams]);

  return (
    <section className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-5 flex items-center gap-3 text-emerald-300">
          <ShieldCheck className="size-6" />
          <h1 className="text-lg font-semibold">Pago seguro con ePayco</h1>
        </div>

        {!error && (
          <p className="mb-4 flex items-center gap-2 text-sm text-slate-300">
            <Loader2 className="size-4 animate-spin" />
            {status}
          </p>
        )}

        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-xl border border-red-700 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            <AlertTriangle className="size-4" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Cerrar esta pestaña
        </button>
      </div>
    </section>
  );
}
