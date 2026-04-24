import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../api/axiosClient';
import { getCurrentUser, logoutUser } from '../api/services/authService';
import {
    addToCart,
    getCartItems,
    getCartTotal,
    removeFromCart,
} from '../api/services/cartService';

const CarritoContext = createContext();
const CART_SETTINGS_KEY = 'movil_dev_cart_settings_v1';

const DEFAULT_CART_SETTINGS = {
  taxRate: 21,
  discountRules: [],
};

const EMPTY_TOTALS = {
  subtotal: 0,
  taxPercent: 0,
  taxAmount: 0,
  shippingFee: 0,
  total: 0,
};

function normalizeCartSettings(rawSettings) {
  const safeTaxRate = Number(rawSettings?.taxRate);
  const taxRate = Number.isFinite(safeTaxRate)
    ? Math.min(100, Math.max(0, safeTaxRate))
    : DEFAULT_CART_SETTINGS.taxRate;

  const discountRules = Array.isArray(rawSettings?.discountRules)
    ? rawSettings.discountRules
      .map((rule) => ({
        referencia: String(rule?.referencia || '').trim(),
        porcentaje: Number(rule?.porcentaje || 0),
      }))
      .filter((rule) => rule.referencia && Number.isFinite(rule.porcentaje) && rule.porcentaje > 0)
      .map((rule) => ({
        referencia: rule.referencia,
        porcentaje: Math.min(100, Math.max(0, rule.porcentaje)),
      }))
    : [];

  return {
    taxRate,
    discountRules,
  };
}

function mapCartItemFromApi(item) {
  return {
    id: item.id,
    productId: item.product_id,
    referencia: item.referencia,
    nombre: item.nombre,
    precio: Number(item.price || 0),
    cantidad: item.quantity,
    image: item.imagen_url || 'https://placehold.co/400x400?text=Producto',
  };
}

export const CarritoProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [cartTotals, setCartTotals] = useState(EMPTY_TOTALS);

  const [cartSettings, setCartSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_SETTINGS_KEY);
      if (!raw) {
        return DEFAULT_CART_SETTINGS;
      }
      return normalizeCartSettings(JSON.parse(raw));
    } catch {
      return DEFAULT_CART_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_SETTINGS_KEY, JSON.stringify(cartSettings));
  }, [cartSettings]);

  useEffect(() => {
    if (!cartError) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setCartError('');
    }, 4000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [cartError]);

  const refreshCart = async () => {
    setIsCartLoading(true);
    setCartError('');

    try {
      const [items, total] = await Promise.all([getCartItems(), getCartTotal()]);
      setCarrito(items.map(mapCartItemFromApi));
      setCartTotals({
        subtotal: Number(total?.subtotal || 0),
        taxPercent: Number(total?.tax_percent || 0),
        taxAmount: Number(total?.tax_amount || 0),
        shippingFee: Number(total?.shipping_fee || 0),
        total: Number(total?.total || 0),
      });
      setCartSettings((prev) =>
        normalizeCartSettings({
          ...prev,
          taxRate: Number(total?.tax_percent || prev.taxRate || 0),
        }),
      );
    } catch (error) {
      setCartError(getApiErrorMessage(error));
    } finally {
      setIsCartLoading(false);
    }
  };

  useEffect(() => {
    const hydrateSession = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setIsAuthLoading(false);
        await refreshCart();
        return;
      }

      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('access_token');
        setCurrentUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsAuthLoading(false);
        await refreshCart();
      }
    };

    hydrateSession();
  }, []);

  const login = async (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    await refreshCart();
  };

  const refreshCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    setIsLoggedIn(true);
    return user;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('access_token');
      await refreshCart();
    }
  };

  const agregarAlCarrito = async (producto, quantity = 1) => {
    try {
      setCartError('');
      await addToCart(producto.id, quantity);
      await refreshCart();
      return true;
    } catch (error) {
      setCartError(getApiErrorMessage(error));
      return false;
    }
  };

  const eliminarDelCarrito = async (id) => {
    try {
      setCartError('');
      await removeFromCart(id);
      await refreshCart();
    } catch (error) {
      setCartError(getApiErrorMessage(error));
    }
  };

  const actualizarCantidad = async (id, delta) => {
    const item = carrito.find((cartItem) => cartItem.id === id);
    if (!item || delta === 0) {
      return;
    }

    const currentQty = Number(item.cantidad || 0);
    const nextQty = currentQty + delta;

    try {
      setCartError('');

      if (nextQty <= 0) {
        await removeFromCart(id);
        await refreshCart();
        return;
      }

      if (delta > 0) {
        await addToCart(item.productId, delta);
        await refreshCart();
        return;
      }

      // El backend actual no expone PATCH quantity, por eso reemplazamos el ítem.
      await removeFromCart(id);
      await addToCart(item.productId, nextQty);
      await refreshCart();
    } catch (error) {
      setCartError(getApiErrorMessage(error));
    }
  };

  const updateCartSettings = (changes) => {
    setCartSettings((prev) => normalizeCartSettings({ ...prev, ...changes }));
  };

  const itemCount = useMemo(
    () => carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
    [carrito],
  );

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        isCartLoading,
        cartError,
        refreshCart,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        subtotal: cartTotals.subtotal,
        descuentoTotal: 0,
        subtotalConDescuento: cartTotals.subtotal,
        costoEnvio: cartTotals.shippingFee,
        iva: cartTotals.taxAmount,
        total: cartTotals.total,
        cartTaxPercent: cartTotals.taxPercent,
        itemCount,
        cartSettings,
        updateCartSettings,
        isLoggedIn,
        setIsLoggedIn,
        currentUser,
        isAuthLoading,
        login,
        logout,
        refreshCurrentUser,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe estar dentro de CarritoProvider');
  }
  return context;
};
