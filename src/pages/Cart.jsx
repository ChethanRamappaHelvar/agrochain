import { useEffect, useState } from "react";
import { Link, useNavigate } from "../router.jsx";
import { api } from "../api.js";
import { useCart, useToast, useUser } from "../context/Contexts.jsx";
import { inr } from "../utils.js";
import { EmptyState, PageHeader, ProductImage, burst } from "../components/Common.jsx";

export function Cart() {
  const { items, inc, dec, remove, setQty, clear, total } = useCart();
  const { user } = useUser();
  const nav = useNavigate();
  const blocked = user && (user.role === "FARMER" || user.role === "ADMIN");
  const [prices, setPrices] = useState([]);
  useEffect(() => { fetch("/market-prices.json").then((r) => r.json()).then(setPrices).catch(() => {}); }, []);
  const savings = items.reduce((s, i) => { const m = prices.find((p) => p.name.toLowerCase() === i.name.toLowerCase()); return s + (m && m.price > i.price ? (m.price - i.price) * i.quantity : 0); }, 0);

  return (
    <>
      <PageHeader title="🛒 Your Cart" subtitle={items.length + " item(s)"} />
      <div className="container page">
        {items.length === 0 ? (
          <EmptyState icon="🛒" title="Your cart is empty" text="Add fresh produce from our farmers."><Link to="/products" className="btn btn-primary">Browse products</Link></EmptyState>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
            <div className="grid">
              {items.map((i) => (
                <div key={i.productId} className="card row between">
                  <div className="row"><ProductImage size="sm" product={{ productName: i.name, category: i.category, imageUrl: i.imageUrl }} />
                    <div><Link to={"/products/" + i.productId}><b>{i.name}</b></Link><div className="small muted">by {i.farmerName}</div><div className="price" style={{ fontSize: 16 }}>{inr(i.price)}<small>/{i.unit}</small></div></div></div>
                  <div className="row">
                    <button className="icon-btn" onClick={() => dec(i.productId)}>−</button>
                    <input type="number" style={{ width: 80, textAlign: "center" }} min="1" max={i.max} value={i.quantity} onChange={(e) => setQty(i.productId, e.target.value)} />
                    <button className="icon-btn" onClick={() => inc(i.productId)}>+</button>
                  </div>
                  <b>{inr(i.price * i.quantity)}</b>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(i.productId)}>🗑 Remove</button>
                </div>
              ))}
            </div>
            <div className="card" style={{ position: "sticky", top: 90 }}>
              <h3 className="mb">Order Summary</h3>
              <div className="row between"><span className="muted">Subtotal</span><b>{inr(total)}</b></div>
              {savings > 0 && <div className="row between mt-s"><span className="muted">You save vs market price</span><b className="save">− {inr(savings)}</b></div>}
              <div className="row between mt-s"><span className="muted">Delivery</span><b style={{ color: "var(--green)" }}>Arranged by farmer</b></div>
              <hr style={{ margin: "14px 0", border: 0, borderTop: "1px solid var(--line)" }} />
              <div className="row between"><b>Total</b><span className="price" style={{ fontSize: 26 }}>{inr(total)}</span></div>
              {blocked && <div className="alert alert-warn mt small">Only buyer and business accounts can place orders.</div>}
              <button className="btn btn-primary btn-block mt" disabled={blocked} onClick={() => nav(user ? "/checkout" : "/login")}>{user ? "Proceed to Checkout" : "Login to Checkout"}</button>
              <button className="btn btn-ghost btn-block mt-s" onClick={clear}>Clear cart</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useUser();
  const toast = useToast();
  const nav = useNavigate();
  const [address, setAddress] = useState(user?.location || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user.role === "FARMER" || user.role === "ADMIN") return <div className="container page"><div className="alert alert-warn">Only buyers and businesses can check out.</div></div>;
  if (items.length === 0) return <div className="container page"><EmptyState icon="🛒" title="Nothing to checkout"><Link to="/products" className="btn btn-primary">Browse products</Link></EmptyState></div>;

  const place = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const orders = await api.post("/orders/place", {
        buyerId: user.id, buyerName: user.name, deliveryAddress: address,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clear(); burst(); toast(`🎉 ${orders.length} order(s) placed successfully!`); nav("/orders");
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="✅ Checkout" subtitle="Confirm your delivery details" />
      <div className="container page">
        <form className="grid" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }} onSubmit={place}>
          <div className="card">
            <h3 className="mb">Delivery Address</h3>
            {err && <div className="alert alert-err">{err}</div>}
            <label className="f">Full address</label>
            <textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, city, state, PIN" />
            <div className="alert alert-info mt small">💵 Payment: Cash / UPI on delivery (agreed with farmer). Your cart is split into one order per farmer.</div>
          </div>
          <div className="card">
            <h3 className="mb">Summary</h3>
            {items.map((i) => <div className="row between small mt-s" key={i.productId}><span>{i.name} × {i.quantity} {i.unit}</span><b>{inr(i.price * i.quantity)}</b></div>)}
            <hr style={{ margin: "14px 0", border: 0, borderTop: "1px solid var(--line)" }} />
            <div className="row between"><b>Total</b><span className="price">{inr(total)}</span></div>
            <button className="btn btn-primary btn-block mt" disabled={busy}>{busy ? "Placing order..." : "Place Order"}</button>
          </div>
        </form>
      </div>
    </>
  );
}
