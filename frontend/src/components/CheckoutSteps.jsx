import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient";
import { updateShippingProfile } from "../api/services/authService";
import {
  createEpaycoSession,
  createPayPalOrder,
} from "../api/services/paymentService";
import { useCarrito } from "../context/CarritoContext";

export default function CheckoutSteps({ currentUser }) {
  const {
    total,
    isLoggedIn,
    isAuthLoading,
    currentUser: sessionUser,
    refreshCurrentUser,
  } = useCarrito();
  const navigate = useNavigate();
  const profile = sessionUser || currentUser || {};
  const savedShipping = profile?.preferences?.shipping || {};
  const isPaypalSandbox = import.meta.env.VITE_PAYPAL_MODE !== "live";

  const [step, setStep] = useState(1);
  const [user, setUser] = useState({
    nombre: savedShipping.receiver_name || profile?.full_name || profile?.nombre || "",
    correo: profile?.email || "",
    telefono: savedShipping.phone || profile?.telefono || "",
  });
  const [entrega, setEntrega] = useState({
    direccion: savedShipping.address || "",
    ciudad: savedShipping.city || "",
  });
  const [error, setError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState("");
  const [isSavingShipping, setIsSavingShipping] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [isAuthLoading, isLoggedIn, navigate]);

  if (isAuthLoading || !isLoggedIn) return null;

  const isLoading = Boolean(loadingProvider);

  const handleUserChange = (e) =>
    setUser({ ...user, [e.target.name]: e.target.value });

  const handleEntregaChange = (e) =>
    setEntrega({ ...entrega, [e.target.name]: e.target.value });

  const validarPaso1 = () => {
    if (!user.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!user.correo.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/))
      return setError("Correo inválido.");
    if (user.telefono.length < 7) return setError("Teléfono inválido.");
    setError("");
    return true;
  };

  const validarPaso2 = () => {
    if (!entrega.direccion.trim())
      return setError("La dirección es obligatoria.");
    if (!entrega.ciudad.trim())
      return setError("La ciudad es obligatoria.");
    setError("");
    return true;
  };

  const saveShippingProfile = async () => {
    setIsSavingShipping(true);
    setError("");
    try {
      await updateShippingProfile({
        receiverName: user.nombre.trim(),
        phone: user.telefono.trim(),
        address: entrega.direccion.trim(),
        city: entrega.ciudad.trim(),
      });
      await refreshCurrentUser();
    } catch (err) {
      setError(getApiErrorMessage(err));
      return false;
    } finally {
      setIsSavingShipping(false);
    }

    return true;
  };

  const buildCheckoutPayload = () => ({
    nombre: user.nombre.trim(),
    correo: user.correo.trim(),
    telefono: user.telefono.trim(),
    direccion: entrega.direccion.trim(),
    ciudad: entrega.ciudad.trim(),
  });

  const loadEpaycoScript = () =>
    new Promise((resolve, reject) => {
      if (window.ePayco?.checkout) {
        resolve();
        return;
      }

      const currentScript = document.getElementById("epayco-checkout-v2-script");
      if (currentScript) {
        currentScript.addEventListener("load", resolve, { once: true });
        currentScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "epayco-checkout-v2-script";
      script.src = "https://checkout.epayco.co/checkout-v2.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  const handlePayPal = async () => {
    setLoadingProvider("paypal");
    setError("");
    try {
      const data = await createPayPalOrder(buildCheckoutPayload());

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("No se pudo generar el pago.");
      setLoadingProvider("");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setLoadingProvider("");
    }
  };

  const handleEpayco = async () => {
    setLoadingProvider("epayco");
    setError("");
    try {
      await loadEpaycoScript();
      const session = await createEpaycoSession(buildCheckoutPayload());

      const checkout = window.ePayco.checkout.configure({
        sessionId: session.session_id,
        type: "onpage",
        test: import.meta.env.VITE_EPAYCO_TEST !== "false",
      });

      checkout.onCreated?.(() => setLoadingProvider(""));
      checkout.onErrors?.((errors) => {
        console.error("Error ePayco:", errors);
        setError("ePayco no pudo abrir el checkout. Intenta nuevamente.");
        setLoadingProvider("");
      });
      checkout.onClosed?.(() => setLoadingProvider(""));
      checkout.open();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setLoadingProvider("");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      
      {/* 🖼 IZQUIERDA - IMAGEN */}
      <div className="hidden lg:block relative h-screen bg-gradient-to-r from-purple-600 to-purple-800 ">
        <img
          src="https://res.cloudinary.com/dms34zmay/image/upload/v1777228417/u015tu0fpx2xuo84zkeg.png"
          alt="checkout"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/" />
      </div>

      <div className="flex items-center justify-center bg-gradient-to-r from-purple-800 to-black shadow-lg shadow-purple-500/20 p-8">
        <div className="w-full max-w-xl  bg-white rounded-2xl shadow-2xl p-12 flex flex-col gap-">

          {/* STEP 1 */}
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (validarPaso1()) setStep(2);
              }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-xl font-bold text-gray-800">
                Datos Personales Para el Envío
              </h2>

              <input
                name="nombre"
                value={user.nombre}
                onChange={handleUserChange}
                placeholder="Nombre completo quien recibe el producto"
                className="input"
              />

              <input
                name="correo"
                value={user.correo}
                onChange={handleUserChange}
                placeholder="Example@example.com"
                className="input"
              />

              <input
                name="telefono"
                value={user.telefono}
                onChange={handleUserChange}
                placeholder="3101234567"
                className="input"
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <button
                  type="button"
                  onClick={() => navigate("/carrito")}
                  className="btn-secondary"
                >
                  Atrás
                </button>

              <button className="btn-primary hover:opacity-80">
                Continuar
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (validarPaso2() && await saveShippingProfile()) setStep(3);
              }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-xl font-bold text-gray-800">
                Dirección de Entrega
              </h2>

              <input
                name="direccion"
                value={entrega.direccion}
                onChange={handleEntregaChange}
                placeholder="Dirección"
                className="input"
              />

              <input
                name="ciudad"
                value={entrega.ciudad}
                onChange={handleEntregaChange}
                placeholder="Ciudad"
                className="input"
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button className="btn-primary" disabled={isSavingShipping}>
                  {isSavingShipping ? "Guardando..." : "Continuar"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Atrás
                </button>

                
              
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-800">Metodos de Pago</h2>
              <p className="text-sm text-gray-500">
                Total a pagar:{" "}
                <span className="font-semibold text-gray-900">
                  {total.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                  })}
                </span>
              </p>
              {isPaypalSandbox && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  PayPal esta en modo pruebas: usa una cuenta sandbox personal, no tu cuenta real.
                </p>
              )}

              <button
                onClick={handlePayPal}
                disabled={isLoading}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                {loadingProvider === "paypal" ? "Conectando con PayPal..." : "Pagar con PayPal"}
              </button>
              <button
                onClick={handleEpayco}
                disabled={isLoading}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                {loadingProvider === "epayco" ? "Abriendo ePayco..." : "Pagar con ePayco"}
              </button>

              <button
                onClick={() => setStep(2)}
                className="btn-secondary"
              >
                Atrás
              </button>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
