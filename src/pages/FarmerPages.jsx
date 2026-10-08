import { useEffect, useMemo, useState } from "react";
import { Link } from "../router.jsx";
import { api } from "../api.js";
import { useToast, useUser } from "../context/Contexts.jsx";
import { useCategories } from "../hooks/hooks.js";
import { FARMING_TYPES, UNITS } from "../data/catalog.js";
import { avg, fmtDate, inr, today } from "../utils.js";
import { EmptyState, Loading, Modal, ProductImage, Rating, StatusBadge, StatCard } from "../components/Common.jsx";

// ------------------------------------------------------------ Product CRUD
export function ManageProducts() {
  const { farmer } = useUser();
  const toast = useToast();
  const cats = useCategories();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const verified = farmer.verificationStatus === "Verified";
  const load = () => api.get("/products?farmerId=" + farmer.id).then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []); // eslint-disable-line

  const blank = { productName: "", category: cats[0].name, price: "", quantity: "", unit: "KG", description: "", imageUrl: "", harvestDate: today(), farmingType: farmer.farmingType || "Conventional", location: farmer.location };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const items = cats.find((c) => c.name === form?.category)?.items || [];

  const save = async (e) => {
    e.preventDefault(); setErr("");
    const body = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
    try {
      if (form.id) await api.put("/products/" + form.id, body); else await api.post("/products", { ...body, farmerId: farmer.id });
      toast(form.id ? "Product updated ✓" : "Product added ✓"); setForm(null); load();
    } catch (ex) { setErr(ex.message); }
  };
  const del = async (p) => { if (window.confirm("Delete " + p.productName + "?")) { await api.del("/products/" + p.id); toast("Product deleted"); load(); } };
  if (!list) return <Loading />;

  return (
    <div>
      <div className="row between mb"><h2>🧺 My Products</h2><button className="btn btn-primary" disabled={!verified} onClick={() => { setForm(blank); setErr(""); }}>+ Add Product</button></div>
      {!verified && <div className="alert alert-warn">You can add products after the admin verifies your farmer account (status: <b>{farmer.verificationStatus}</b>).</div>}
      {list.length === 0 ? <EmptyState icon="🧺" title="No products yet" text="Add your first product to start selling." /> : (
        <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Lot ID</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((p) => <tr key={p.id}><td><div className="row"><ProductImage product={p} size="sm" /><b>{p.productName}</b></div></td><td>{p.category}</td><td>{inr(p.price)}/{p.unit}</td><td>{p.quantity} {p.unit}</td><td className="small">{p.lotId}</td>
            <td>{p.quantity <= 0 ? <span className="badge red">OUT OF STOCK</span> : p.quantity < 50 ? <span className="badge amber">Low Stock</span> : <span className="badge">Available</span>}</td>
            <td><div className="row"><button className="btn btn-ghost btn-sm" onClick={() => { setForm(p); setErr(""); }}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => del(p)}>Delete</button></div></td></tr>)}</tbody></table></div>
      )}
      {form && (
        <Modal title={form.id ? "Edit product" : "Add product"} onClose={() => setForm(null)}>
          {err && <div className="alert alert-err">{err}</div>}
          <form onSubmit={save}><div className="form-grid">
            <div><label className="f">Category</label><select value={form.category} onChange={set("category")}>{cats.map((c) => <option key={c.name}>{c.name}</option>)}</select></div>
            <div><label className="f">Product name</label><input required list="items" value={form.productName} onChange={set("productName")} /><datalist id="items">{items.map((i) => <option key={i} value={i} />)}</datalist></div>
            <div><label className="f">Price (₹)</label><input type="number" required min="0" step="0.5" value={form.price} onChange={set("price")} /></div>
            <div><label className="f">Unit</label><select value={form.unit} onChange={set("unit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
            <div><label className="f">Quantity available</label><input type="number" required min="0" value={form.quantity} onChange={set("quantity")} /></div>
            <div><label className="f">Harvest date</label><input type="date" value={form.harvestDate || ""} onChange={set("harvestDate")} /></div>
            <div><label className="f">Farming type</label><select value={form.farmingType} onChange={set("farmingType")}>{FARMING_TYPES.map((u) => <option key={u}>{u}</option>)}</select></div>
            <div><label className="f">Location</label><input value={form.location || ""} onChange={set("location")} /></div>
            <div className="full"><label className="f">Image URL (optional)</label><input value={form.imageUrl || ""} onChange={set("imageUrl")} placeholder="https://... (a nice emoji tile is used if empty)" /></div>
            <div className="full"><label className="f">Description</label><textarea value={form.description || ""} onChange={set("description")} /></div>
          </div><button className="btn btn-primary btn-block mt">{form.id ? "Update Product" : "Add Product"}</button></form>
        </Modal>)}
    </div>
  );
}

// ------------------------------------------------------------ Inventory
export function Inventory() {
  const { farmer } = useUser();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [edit, setEdit] = useState({});
  const load = () => api.get("/products?farmerId=" + farmer.id).then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []); // eslint-disable-line
  if (!list) return <Loading />;
  const max = Math.max(1, ...list.map((p) => p.quantity));
  const save = async (p) => {
    const e = edit[p.id]; if (!e) return;
    await api.put("/products/" + p.id, { quantity: Number(e.quantity ?? p.quantity), price: Number(e.price ?? p.price) });
    toast("Updated " + p.productName + " ✓"); setEdit({ ...edit, [p.id]: undefined }); load();
  };
  const ch = (p, k) => (ev) => setEdit({ ...edit, [p.id]: { ...edit[p.id], [k]: ev.target.value } });
  const low = list.filter((p) => p.quantity > 0 && p.quantity < 50);
  const out = list.filter((p) => p.quantity <= 0);
  return (
    <div>
      <h2 className="mb">📦 Inventory</h2>
      <div className="grid g3 mb"><StatCard icon="🧺" label="Products" value={list.length} /><StatCard icon="⚠️" label="Low stock" value={low.length} /><StatCard icon="🚫" label="Out of stock" value={out.length} /></div>
      {low.map((p) => <div className="alert alert-warn" key={p.id}>⚠ <b>{p.productName}</b> — only {p.quantity} {p.unit} remaining</div>)}
      {list.length === 0 ? <EmptyState icon="📦" title="No inventory" text="Add products first."><Link to="/farmer/products" className="btn btn-primary">Add products</Link></EmptyState> : (
        <div className="table-wrap"><table><thead><tr><th>Product</th><th style={{ width: "28%" }}>Stock level</th><th>Quantity</th><th>Price (₹)</th><th></th></tr></thead>
          <tbody>{list.map((p) => <tr key={p.id}><td><b>{p.productName}</b><div className="small muted">{p.lotId}</div></td>
            <td><div className="bar"><i style={{ width: (p.quantity / max) * 100 + "%", background: p.quantity < 50 ? "var(--amber)" : undefined }} /></div>
              <div className="small mt-s">{p.quantity <= 0 ? <b style={{ color: "var(--red)" }}>OUT OF STOCK</b> : p.quantity < 50 ? <b style={{ color: "#a8321f" }}>Low Stock</b> : "In stock"}</div></td>
            <td><input type="number" min="0" style={{ width: 110 }} value={edit[p.id]?.quantity ?? p.quantity} onChange={ch(p, "quantity")} /></td>
            <td><input type="number" min="0" style={{ width: 100 }} value={edit[p.id]?.price ?? p.price} onChange={ch(p, "price")} /></td>
            <td><button className="btn btn-primary btn-sm" disabled={!edit[p.id]} onClick={() => save(p)}>Save</button></td></tr>)}</tbody></table></div>)}
    </div>
  );
}

// ------------------------------------------------------------ Future harvests
export function ManageHarvests() {
  const { farmer } = useUser();
  const toast = useToast();
  const cats = useCategories();
  const [list, setList] = useState(null);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const verified = farmer.verificationStatus === "Verified";
  const load = () => Promise.all([api.get("/harvests?farmerId=" + farmer.id), api.get("/harvest-bookings?farmerId=" + farmer.id)]).then(([h, b]) => { setList(h); setBooks(b); });
  useEffect(() => { load(); }, []); // eslint-disable-line
  const blank = { cropName: "", expectedQuantity: "", expectedPrice: "", harvestDate: today(), farmingType: farmer.farmingType || "Conventional", description: "" };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const allItems = useMemo(() => cats.flatMap((c) => c.items), [cats]);

  const save = async (e) => {
    e.preventDefault(); setErr("");
    try {
      if (form.id) {
        await api.put("/harvests/" + form.id, { cropName: form.cropName, expectedPrice: Number(form.expectedPrice), harvestDate: form.harvestDate, description: form.description, farmingType: form.farmingType, status: form.status });
      } else {
        const q = Number(form.expectedQuantity);
        await api.post("/harvests", { ...form, expectedQuantity: q, availableQuantity: q, expectedPrice: Number(form.expectedPrice), farmerId: farmer.id, farmerName: farmer.name, farmName: farmer.farmName, location: farmer.location, status: "Open" });
      }
      toast("Harvest listing saved ✓"); setForm(null); load();
    } catch (ex) { setErr(ex.message); }
  };
  const setBook = async (b, status) => { try { await api.put("/harvest-bookings/" + b.id, { status }); toast("Booking " + status.toLowerCase()); load(); } catch (e) { toast(e.message, "error"); } };
  if (!list) return <Loading />;

  return (
    <div>
      <div className="row between mb"><h2>🌱 My Future Harvests</h2><button className="btn btn-primary" disabled={!verified} onClick={() => { setForm(blank); setErr(""); }}>+ New Harvest Listing</button></div>
      {!verified && <div className="alert alert-warn">Only verified farmers can publish future harvests.</div>}
      {list.length === 0 ? <EmptyState icon="🌱" title="No future harvests" text="List crops that are growing now so buyers can reserve them." /> : (
        <div className="table-wrap"><table><thead><tr><th>Crop</th><th>Harvest date</th><th>Available / Expected</th><th>Price</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((h) => <tr key={h.id}><td><b>{h.cropName}</b></td><td>{fmtDate(h.harvestDate)}</td><td>{h.availableQuantity} / {h.expectedQuantity} KG</td><td>{inr(h.expectedPrice)}</td><td><StatusBadge status={h.status} /></td>
            <td><div className="row"><button className="btn btn-ghost btn-sm" onClick={() => { setForm(h); setErr(""); }}>Edit</button><button className="btn btn-danger btn-sm" onClick={async () => { if (window.confirm("Delete listing?")) { await api.del("/harvests/" + h.id); load(); } }}>Delete</button></div></td></tr>)}</tbody></table></div>)}

      <h3 className="mt mb">Reservations received</h3>
      {books.length === 0 ? <div className="muted">No reservations yet.</div> : (
        <div className="table-wrap"><table><thead><tr><th>Crop</th><th>Buyer</th><th>Quantity</th><th>Value</th><th>Booked</th><th>Status</th><th></th></tr></thead>
          <tbody>{books.map((b) => <tr key={b.id}><td><b>{b.cropName}</b></td><td>{b.buyerName}</td><td>{b.quantity} KG</td><td>{inr(b.quantity * b.price)}</td><td>{fmtDate(b.bookingDate)}</td><td><StatusBadge status={b.status} /></td>
            <td>{b.status === "Reserved" && <div className="row"><button className="btn btn-primary btn-sm" onClick={() => setBook(b, "Confirmed")}>Confirm</button><button className="btn btn-ghost btn-sm" onClick={() => setBook(b, "Cancelled")}>Cancel</button></div>}</td></tr>)}</tbody></table></div>)}

      {form && (
        <Modal title={form.id ? "Edit harvest listing" : "New harvest listing"} onClose={() => setForm(null)}>
          {err && <div className="alert alert-err">{err}</div>}
          <form onSubmit={save}><div className="form-grid">
            <div><label className="f">Crop</label><input required list="crops" value={form.cropName} onChange={set("cropName")} /><datalist id="crops">{allItems.map((i) => <option key={i} value={i} />)}</datalist></div>
            <div><label className="f">Expected harvest date</label><input type="date" required value={form.harvestDate} onChange={set("harvestDate")} /></div>
            {!form.id && <div><label className="f">Expected quantity (KG)</label><input type="number" required min="1" value={form.expectedQuantity} onChange={set("expectedQuantity")} /></div>}
            <div><label className="f">Expected price (₹/KG)</label><input type="number" required min="1" value={form.expectedPrice} onChange={set("expectedPrice")} /></div>
            <div><label className="f">Farming type</label><select value={form.farmingType} onChange={set("farmingType")}>{FARMING_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            {form.id && <div><label className="f">Status</label><select value={form.status} onChange={set("status")}><option>Open</option><option>Closed</option><option>Fully Booked</option></select></div>}
            <div className="full"><label className="f">Description</label><textarea value={form.description || ""} onChange={set("description")} /></div>
          </div><button className="btn btn-primary btn-block mt">Save</button></form>
        </Modal>)}
    </div>
  );
}

// ------------------------------------------------------------ Revenue (map / filter / reduce)
export function Revenue() {
  const { farmer } = useUser();
  const [d, setD] = useState(null);
  useEffect(() => {
    Promise.all([api.get("/orders?farmerId=" + farmer.id), api.get("/order-items")]).then(([orders, items]) => setD({ orders, items })).catch(() => setD({ orders: [], items: [] }));
  }, []); // eslint-disable-line
  if (!d) return <Loading />;
  const done = d.orders.filter((o) => o.status === "Delivered");
  const sum = (arr) => arr.reduce((s, o) => s + o.totalAmount, 0);
  const t = today();
  const month = t.slice(0, 7);
  const ids = done.map((o) => o.id);
  const sold = d.items.filter((i) => ids.includes(i.orderId));
  const byProduct = Object.entries(sold.reduce((m, i) => { m[i.productName] = (m[i.productName] || 0) + i.quantity * i.price; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const months = Object.entries(done.reduce((m, o) => { const k = o.orderDate.slice(0, 7); m[k] = (m[k] || 0) + o.totalAmount; return m; }, {})).sort().slice(-6);
  const maxM = Math.max(1, ...months.map((x) => x[1]));
  const maxP = Math.max(1, ...byProduct.map((x) => x[1]));
  return (
    <div>
      <h2 className="mb">💰 Revenue Dashboard</h2>
      <div className="grid g3">
        <StatCard icon="📅" label="Today's Revenue" value={inr(sum(done.filter((o) => o.orderDate === t)))} /><StatCard icon="🗓️" label="This Month" value={inr(sum(done.filter((o) => o.orderDate.startsWith(month))))} /><StatCard icon="💰" label="Total Revenue" value={inr(sum(done))} />
        <StatCard icon="🧺" label="Items Sold" value={sold.length} /><StatCard icon="✅" label="Orders Completed" value={done.length} /><StatCard icon="⏳" label="In Progress" value={d.orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length} />
      </div>
      <div className="grid g2 mt" style={{ alignItems: "start" }}>
        <div className="card"><h3>Monthly revenue</h3>{months.length === 0 ? <p className="muted mt-s">No completed orders yet.</p> :
          <div className="bars">{months.map(([m, v]) => <div key={m}><span>{inr(v)}</span><i style={{ height: (v / maxM) * 120 + "px" }} /><span>{m.slice(2)}</span></div>)}</div>}</div>
        <div className="card"><h3>Top products by revenue</h3>{byProduct.length === 0 ? <p className="muted mt-s">Nothing sold yet.</p> :
          byProduct.slice(0, 6).map(([n, v]) => <div key={n} className="mt-s"><div className="row between small"><b>{n}</b><span>{inr(v)}</span></div><div className="bar"><i style={{ width: (v / maxP) * 100 + "%" }} /></div></div>)}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Reviews
export function FarmerReviews() {
  const { farmer } = useUser();
  const [list, setList] = useState(null);
  useEffect(() => { api.get("/reviews?farmerId=" + farmer.id).then(setList).catch(() => setList([])); }, []); // eslint-disable-line
  if (!list) return <Loading />;
  return (
    <div>
      <div className="row between mb"><h2>⭐ Product Reviews</h2><Rating value={avg(list)} count={list.length} /></div>
      {list.length === 0 ? <EmptyState icon="⭐" title="No reviews yet" text="Reviews appear after buyers receive their orders." /> :
        <div className="grid g2">{list.map((r) => <div className="card" key={r.id}><div className="row between"><b>{r.buyerName}</b><span className="small muted">{fmtDate(r.reviewDate)}</span></div><div className="small muted">on {r.productName}</div><Rating value={r.rating} /><p className="mt-s">{r.comment}</p></div>)}</div>}
    </div>
  );
}

// ------------------------------------------------------------ My offers & applications
export function FarmerOffers() {
  const { farmer } = useUser();
  const [d, setD] = useState(null);
  useEffect(() => {
    Promise.all([api.get("/requirement-responses?farmerId=" + farmer.id), api.get("/contract-applications?farmerId=" + farmer.id), api.get("/requirements"), api.get("/contracts")])
      .then(([resps, apps, reqs, contracts]) => setD({ resps, apps, reqs, contracts })).catch(() => setD({ resps: [], apps: [], reqs: [], contracts: [] }));
  }, []); // eslint-disable-line
  if (!d) return <Loading />;
  const reqOf = (id) => d.reqs.find((r) => r.id === id);
  return (
    <div>
      <h2 className="mb">💼 My Offers & Applications</h2>
      <h3 className="mb">Bulk requirement offers</h3>
      {d.resps.length === 0 ? <div className="muted mb">No offers yet. <Link to="/requirements" className="bold" style={{ color: "var(--green)" }}>Browse requirements →</Link></div> :
        <div className="table-wrap mb"><table><thead><tr><th>Requirement</th><th>Company</th><th>Quantity</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>{d.resps.map((x) => { const r = reqOf(x.requirementId); return <tr key={x.id}><td><Link to={"/requirements/" + x.requirementId}><b>{r?.productName || "#" + x.requirementId}</b></Link></td><td>{r?.companyName}</td><td>{x.availableQuantity} KG</td><td>{inr(x.proposedPrice)}</td><td><StatusBadge status={x.status} /></td></tr>; })}</tbody></table></div>}
      <h3 className="mt mb">Contract farming applications</h3>
      {d.apps.length === 0 ? <div className="muted">No applications yet. <Link to="/contracts" className="bold" style={{ color: "var(--green)" }}>View contracts →</Link></div> :
        <div className="table-wrap"><table><thead><tr><th>Crop</th><th>Company</th><th>Quantity</th><th>Proposed price</th><th>Status</th></tr></thead>
          <tbody>{d.apps.map((a) => <tr key={a.id}><td><b>{a.cropName}</b></td><td>{d.contracts.find((c) => c.id === a.contractId)?.companyName}</td><td>{a.availableQuantity} KG</td><td>{inr(a.proposedPrice)}</td><td><StatusBadge status={a.status} /></td></tr>)}</tbody></table></div>}
    </div>
  );
}
