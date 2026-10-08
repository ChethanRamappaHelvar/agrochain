import { useEffect, useState } from "react";
import { Link, useParams } from "../router.jsx";
import { api } from "../api.js";
import { useCart, useToast, useUser } from "../context/Contexts.jsx";
import { fmtDate, inr } from "../utils.js";
import { EmptyState, ErrorBox, Loading, OrderTimeline, Rating, StatusBadge } from "../components/Common.jsx";

// next step a farmer can move an order to
export const NEXT = { "Order Placed": "Accepted", Accepted: "Preparing", Preparing: "Ready", Ready: "Dispatched", Dispatched: "Delivered" };
const FILTERS = ["All", "Order Placed", "Accepted", "Preparing", "Ready", "Dispatched", "Delivered", "Cancelled"];

export function Orders() {
  const { user, farmer } = useUser();
  const toast = useToast();
  const isFarmer = user.role === "FARMER";
  const [orders, setOrders] = useState(null);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [err, setErr] = useState("");

  const load = () => {
    const q = isFarmer ? "farmerId=" + (farmer?.id ?? 0) : "buyerId=" + user.id;
    Promise.all([api.get("/orders?" + q), api.get("/order-items")]).then(([o, i]) => { setOrders(o); setItems(i); }).catch((e) => setErr(e.message));
  };
  useEffect(load, []); // eslint-disable-line

  const setStatus = async (o, status) => {
    try { await api.put("/orders/" + o.id, { status }); toast("Order #" + o.id + " → " + status); load(); } catch (e) { toast(e.message, "error"); }
  };
  if (!orders) return err ? <ErrorBox message={err} /> : <Loading />;
  const list = orders.filter((o) => filter === "All" || o.status === filter);

  return (
    <div>
      <h2 className="mb">{isFarmer ? "🧾 Orders Received" : "📦 My Orders"}</h2>
      <div className="tabs">{FILTERS.map((f) => <button key={f} className={"tab" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f}{f !== "All" && ` (${orders.filter((o) => o.status === f).length})`}</button>)}</div>
      {list.length === 0 ? <EmptyState icon="📦" title="No orders here" text={isFarmer ? "New orders will appear here." : "Start shopping to place your first order."}>{!isFarmer && <Link to="/products" className="btn btn-primary">Browse products</Link>}</EmptyState> : (
        <div className="grid">
          {list.map((o) => {
            const its = items.filter((i) => i.orderId === o.id);
            return (
              <div className="card" key={o.id}>
                <div className="row between">
                  <div><b>Order #{o.id}</b> <span className="muted small">• {fmtDate(o.orderDate)}</span><div className="small muted">{isFarmer ? "Buyer: " + o.buyerName : "Farmer: " + o.farmerName}</div></div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="small mt-s">{its.map((i) => `${i.productName} × ${i.quantity} ${i.unit || ""}`).join("  •  ")}</div>
                <div className="row between mt">
                  <span className="price">{inr(o.totalAmount)}</span>
                  <div className="row">
                    {isFarmer && NEXT[o.status] && <button className="btn btn-primary btn-sm" onClick={() => setStatus(o, NEXT[o.status])}>{o.status === "Order Placed" ? "✓ Accept" : "Mark " + NEXT[o.status]}</button>}
                    {isFarmer && o.status === "Order Placed" && <button className="btn btn-danger btn-sm" onClick={() => setStatus(o, "Cancelled")}>Reject</button>}
                    {!isFarmer && o.status === "Order Placed" && <button className="btn btn-ghost btn-sm" onClick={() => window.confirm("Cancel this order?") && setStatus(o, "Cancelled")}>Cancel</button>}
                    <Link to={"/orders/" + o.id} className="btn btn-outline btn-sm">Details & Tracking</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrderDetails() {
  const { id } = useParams();
  const { user } = useUser();
  const toast = useToast();
  const { add } = useCart();
  const [o, setO] = useState(null);
  const [items, setItems] = useState([]);
  const [mine, setMine] = useState([]);
  const [draft, setDraft] = useState({});
  const [err, setErr] = useState("");
  const isFarmer = user.role === "FARMER";

  const load = () => {
    api.get("/orders/" + id).then((ord) => {
      setO(ord);
      api.get("/order-items?orderId=" + id).then(setItems);
      api.get("/reviews?buyerId=" + ord.buyerId).then(setMine).catch(() => {});
    }).catch((e) => setErr(e.message));
  };
  useEffect(load, [id]); // eslint-disable-line

  if (err) return <ErrorBox message={err} />;
  if (!o) return <Loading />;
  const setStatus = async (status) => { try { await api.put("/orders/" + o.id, { status }); toast("Status updated: " + status); load(); } catch (e) { toast(e.message, "error"); } };
  const orderAgain = async () => {
    let n = 0;
    for (const i of items) { if (!i.productId) continue; try { const p = await api.get("/products/" + i.productId); if (p.quantity > 0) { add(p, Math.min(i.quantity, p.quantity)); n++; } } catch (e) { /* skip */ } }
    toast(n ? n + " item(s) added to cart 🛒" : "Items are no longer available", n ? "ok" : "error");
  };
  const reviewed = (pid) => mine.some((r) => r.productId === pid);
  const submitReview = async (i) => {
    const d = draft[i.id] || {};
    if (!d.rating) return toast("Please select a star rating", "error");
    try {
      await api.post("/reviews", { productId: i.productId, productName: i.productName, farmerId: o.farmerId, buyerId: user.id, buyerName: user.name, rating: d.rating, comment: d.comment || "" });
      toast("Thanks for your review! ⭐"); load();
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div className="small muted mb"><Link to="/orders">Orders</Link> / #{o.id}</div>
      <div className="card">
        <div className="row between"><h2>Order #{o.id}</h2><StatusBadge status={o.status} /></div>
        <OrderTimeline status={o.status} />
        <dl className="kv mt">
          <dt>Order date</dt><dd>{fmtDate(o.orderDate)}</dd><dt>Buyer</dt><dd>{o.buyerName}</dd><dt>Farmer</dt><dd><Link to={"/farmers/" + o.farmerId} style={{ color: "var(--green)" }}>{o.farmerName}</Link></dd>
          <dt>Delivery address</dt><dd>{o.deliveryAddress}</dd><dt>Total</dt><dd><b>{inr(o.totalAmount)}</b></dd>
        </dl>
        <div className="row mt">
          <button className="btn btn-outline" onClick={() => window.print()}>🖨 Download Invoice</button>
          {!isFarmer && user.role !== "ADMIN" && <button className="btn btn-ghost" onClick={orderAgain}>🔁 Order Again</button>}
          {isFarmer && NEXT[o.status] && <button className="btn btn-primary" onClick={() => setStatus(NEXT[o.status])}>{o.status === "Order Placed" ? "✓ Accept Order" : "Mark as " + NEXT[o.status]}</button>}
          {isFarmer && o.status === "Order Placed" && <button className="btn btn-danger" onClick={() => setStatus("Cancelled")}>Reject</button>}
          {!isFarmer && o.status === "Order Placed" && <button className="btn btn-ghost" onClick={() => window.confirm("Cancel this order?") && setStatus("Cancelled")}>Cancel Order</button>}
        </div>
      </div>

      <h3 className="mt mb">Items</h3>
      <div className="table-wrap"><table><thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>{items.map((i) => <tr key={i.id}><td>{i.productId ? <Link to={"/products/" + i.productId}>{i.productName}</Link> : i.productName}</td><td>{i.quantity} {i.unit}</td><td>{inr(i.price)}</td><td><b>{inr(i.quantity * i.price)}</b></td></tr>)}</tbody></table></div>

      {!isFarmer && o.status === "Delivered" && user.role !== "ADMIN" && (
        <>
          <h3 className="mt mb">Rate your purchase</h3>
          <div className="grid">
            {items.filter((i) => i.productId).map((i) => (
              <div className="card" key={i.id}>
                <b>{i.productName}</b>
                {reviewed(i.productId) ? <div className="alert alert-ok mt-s" style={{ margin: 0 }}>✓ You already reviewed this product.</div> : (
                  <>
                    <Rating value={draft[i.id]?.rating || 0} onChange={(n) => setDraft({ ...draft, [i.id]: { ...draft[i.id], rating: n } })} />
                    <textarea placeholder="Write your review..." value={draft[i.id]?.comment || ""} onChange={(e) => setDraft({ ...draft, [i.id]: { ...draft[i.id], comment: e.target.value } })} />
                    <button className="btn btn-primary btn-sm mt-s" onClick={() => submitReview(i)}>Submit Review</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
