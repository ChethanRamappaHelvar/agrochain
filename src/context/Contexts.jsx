import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { LANG } from "../data/lang.js";
import { load, save } from "../utils.js";

export const UserContext = createContext();
export const CartContext = createContext();
export const FavoriteContext = createContext();
export const LanguageContext = createContext();
export const ToastContext = createContext();

export const useUser = () => useContext(UserContext);
export const useCart = () => useContext(CartContext);
export const useFav = () => useContext(FavoriteContext);
export const useLang = () => useContext(LanguageContext);
export const useToast = () => useContext(ToastContext);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.type}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function UserProvider({ children }) {
  const [session, setSession] = useState(() => load("agro_session", null));
  useEffect(() => {
    session
      ? save("agro_session", session)
      : localStorage.removeItem("agro_session");
  }, [session]);
  const value = {
    session,
    user: session?.user || null,
    farmer: session?.farmer || null,
    login: (s) => setSession(s),
    logout: () => setSession(null),
    patch: (p) => setSession((s) => (s ? { ...s, ...p } : s)),
  };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => load("agro_lang", "en"));
  useEffect(() => save("agro_lang", lang), [lang]);
  const t = (k) => LANG[lang]?.[k] ?? LANG.en[k] ?? k;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function CartProvider({ children }) {
  const [items, setItems] = useState(() => load("agro_cart", []));
  useEffect(() => save("agro_cart", items), [items]);
  const add = (p, qty = 1) =>
    setItems((prev) => {
      const q = Math.max(1, Number(qty) || 1);
      if (prev.find((i) => i.productId === p.id))
        return prev.map((i) =>
          i.productId === p.id
            ? {
                ...i,
                max: p.quantity,
                quantity: Math.min(i.quantity + q, p.quantity),
              }
            : i,
        );
      return [
        ...prev,
        {
          productId: p.id,
          name: p.productName,
          price: p.price,
          unit: p.unit,
          quantity: Math.min(q, p.quantity),
          max: p.quantity,
          farmerId: p.farmerId,
          farmerName: p.farmerName,
          category: p.category,
          imageUrl: p.imageUrl,
        },
      ];
    });
  const remove = (id) => setItems((p) => p.filter((i) => i.productId !== id));
  const setQty = (id, q) =>
    setItems((p) =>
      p.map((i) =>
        i.productId === id
          ? { ...i, quantity: Math.max(1, Math.min(Number(q) || 1, i.max)) }
          : i,
      ),
    );
  const inc = (id) =>
    setItems((p) =>
      p.map((i) =>
        i.productId === id
          ? { ...i, quantity: Math.min(i.quantity + 1, i.max) }
          : i,
      ),
    );
  const dec = (id) =>
    setItems((p) =>
      p.map((i) =>
        i.productId === id
          ? { ...i, quantity: Math.max(i.quantity - 1, 1) }
          : i,
      ),
    );
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        setQty,
        inc,
        dec,
        clear,
        total,
        count: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

function FavoriteProvider({ children }) {
  const [fav, setFav] = useState(() =>
    load("agro_fav", { products: [], farmers: [] }),
  );
  useEffect(() => save("agro_fav", fav), [fav]);
  const toggle = (kind, id) =>
    setFav((f) => ({
      ...f,
      [kind]: f[kind].includes(id)
        ? f[kind].filter((x) => x !== id)
        : [...f[kind], id],
    }));
  return (
    <FavoriteContext.Provider
      value={{
        fav,
        toggleProduct: (id) => toggle("products", id),
        toggleFarmer: (id) => toggle("farmers", id),
        isProduct: (id) => fav.products.includes(id),
        isFarmer: (id) => fav.farmers.includes(id),
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
}

export function Providers({ children }) {
  return (
    <ToastProvider>
      <UserProvider>
        <LanguageProvider>
          <CartProvider>
            <FavoriteProvider>{children}</FavoriteProvider>
          </CartProvider>
        </LanguageProvider>
      </UserProvider>
    </ToastProvider>
  );
}
