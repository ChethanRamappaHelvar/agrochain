import { useEffect, useState } from "react";
import { Link } from "../router.jsx";
import { api } from "../api.js";
import { useToast } from "../context/Contexts.jsx";
import { fmtDate, inr } from "../utils.js";
import { Donut, EmptyState, Loading, Modal, StatCard, StatusBadge } from "../components/Common.jsx";

// small helper: load several lists at once
function useLists(paths) {
  const [d, setD] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { Promise.all(paths.map((p) => api.get(p).catch(() => []))).then(setD); }, [tick]); // eslint-disable-line
  return [d, () => setTick((t) => t + 1)];
}
const Table = ({ head, children, empty = "Nothing to show" }) => (
  Array.isArray(children) && children.length === 0 ? <EmptyState icon="📭" title={empty} /> :
  <div className="table-wrap"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
);

export function AdminDashboard() {
  const [d] = useLists(["/users", "/farmers", "/products", "/orders", "/requirements", "/contracts", "/harvests", "/reviews"]);
  if (!d) return <Loading />;
  const [users, farmers, products, orders, reqs, contracts, harvests, reviews] = d;
  const pending = farmers.filter((f) => f.verificationStatus === "Pending");
  return (
    <div>
      <h2 className="mb">🛡️ Admin Dashboard</h2>
      {pending.length > 0 && <div className="alert alert-warn row between"><span>⏳ <b>{pending.length}</b> farmer(s) waiting for verification</span><Link to="/admin/farmers" className="btn btn-primary btn-sm">Review now</Link></div>}
      <div className="grid g3">
        <StatCard icon="👥" label="Total Users" value={users.length} /><StatCard icon="👨‍🌾" label="Total Farmers" value={farmers.length} /><StatCard icon="✅" label="Verified Farmers" value={farmers.filter((f) => f.verificationStatus === "Verified").length} />
        <StatCard icon="⏳" label="Pending Farmers" value={pending.length} /><StatCard icon="🛒" label="Total Buyers" value={users.filter((u) => u.role === "BUYER").length} /><StatCard icon="🏢" label="Businesses" value={users.filter((u) => u.role === "BUSINESS").length} />
        <StatCard icon="🧺" label="Total Products" value={products.length} /><StatCard icon="🧾" label="Total Orders" value={orders.length} /><StatCard icon="💰" label="Delivered Value" value={inr(orders.filter((o) => o.status === "Delivered").reduce((s, o) => s + o.totalAmount, 0))} />
        <StatCard icon="📝" label="Bulk Requirements" value={reqs.length} /><StatCard icon="📃" label="Contract Requests" value={contracts.length} /><StatCard icon="🌱" label="Future Harvests" value={harvests.length} />
      </div>
      <div className="grid g2 mt">
        <div className="card"><h3 className="mb">Users by role</h3><Donut center={users.length} data={[["FARMER", "#0f9d94"], ["BUYER", "#e8523f"], ["BUSINESS", "#2b6cb0"], ["ADMIN", "#8a99a0"]].map(([label, color]) => ({ label, color, value: users.filter((u) => u.role === label).length }))} /></div>
        <div className="card"><h3 className="mb">Farmer verification</h3><Donut center={farmers.length} data={[["Verified", "#0f9d94"], ["Pending", "#f2a33a"], ["Rejected", "#c62839"]].map(([label, color]) => ({ label, color, value: farmers.filter((f) => f.verificationStatus === label).length }))} /></div>
      </div>
      <div className="card mt"><h3>Platform at a glance</h3><p className="muted mt-s">{reviews.length} reviews • {orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length} active orders • {reqs.filter((r) => r.status === "Open").length} open requirements.</p></div>
    </div>
  );
}

export function AdminFarmers() {
  const toast = useToast();
  const [d, reload] = useLists(["/farmers"]);
  const [filter, setFilter] = useState("All");
  if (!d) return <Loading />;
  const set = async (f, verificationStatus) => { await api.put("/farmers/" + f.id, { verificationStatus }); toast(f.name + " → " + verificationStatus); reload(); };
  const list = d[0].filter((f) => filter === "All" || f.verificationStatus === filter);
  return (
    <div>
      <h2 className="mb">👨‍🌾 Farmer Verification</h2>
      <div className="tabs">{["All", "Pending", "Verified", "Rejected"].map((s) => <button key={s} className={"tab" + (filter === s ? " on" : "")} onClick={() => setFilter(s)}>{s}</button>)}</div>
      <Table head={["Farmer", "Farm", "Location", "Size", "Type", "Crops", "Status", ""]}>
        {list.map((f) => <tr key={f.id}><td><b>{f.name}</b><div className="small muted">{f.email} • {f.phone}</div></td><td>{f.farmName}</td><td>{f.location}</td><td>{f.farmSize} ac</td><td>{f.farmingType}</td><td className="small">{f.mainCrops}</td><td><StatusBadge status={f.verificationStatus} /></td>
          <td><div className="row">{f.verificationStatus !== "Verified" && <button className="btn btn-primary btn-sm" onClick={() => set(f, "Verified")}>✓ Verify</button>}{f.verificationStatus !== "Rejected" && <button className="btn btn-danger btn-sm" onClick={() => set(f, "Rejected")}>Reject</button>}</div></td></tr>)}
      </Table>
    </div>
  );
}

export function AdminUsers() {
  const toast = useToast();
  const [d, reload] = useLists(["/users"]);
  const [role, setRole] = useState("All");
  if (!d) return <Loading />;
  const toggle = async (u) => { const status = u.status === "Blocked" ? "Active" : "Blocked"; await api.put("/users/" + u.id, { status }); toast(u.name + " " + status.toLowerCase()); reload(); };
  const list = d[0].filter((u) => role === "All" || u.role === role);
  return (
    <div>
      <h2 className="mb">👥 Users</h2>
      <div className="tabs">{["All", "FARMER", "BUYER", "BUSINESS", "ADMIN"].map((s) => <button key={s} className={"tab" + (role === s ? " on" : "")} onClick={() => setRole(s)}>{s}</button>)}</div>
      <Table head={["ID", "Name", "Email", "Phone", "Role", "Location", "Status", ""]}>
        {list.map((u) => <tr key={u.id}><td>{u.id}</td><td><b>{u.name}</b>{u.businessType && <div className="small muted">{u.businessType}</div>}</td><td>{u.email}</td><td>{u.phone}</td><td><span className="badge blue">{u.role}</span></td><td>{u.location}</td><td><StatusBadge status={u.status} /></td>
          <td>{u.role !== "ADMIN" && <button className={"btn btn-sm " + (u.status === "Blocked" ? "btn-primary" : "btn-ghost")} onClick={() => toggle(u)}>{u.status === "Blocked" ? "Unblock" : "Block"}</button>}</td></tr>)}
      </Table>
    </div>
  );
}

export function AdminProducts() {
  const toast = useToast();
  const [d, reload] = useLists(["/products"]);
  const [q, setQ] = useState("");
  if (!d) return <Loading />;
  const del = async (p) => { if (window.confirm("Delete " + p.productName + "?")) { await api.del("/products/" + p.id); toast("Product deleted"); reload(); } };
  const list = d[0].filter((p) => (p.productName + p.farmName + p.category).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <h2 className="mb">🧺 All Products</h2>
      <input placeholder="🔍 Search" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360, borderRadius: 999 }} className="mb" />
      <Table head={["ID", "Product", "Category", "Farmer", "Price", "Stock", "Lot", ""]}>
        {list.map((p) => <tr key={p.id}><td>{p.id}</td><td><Link to={"/products/" + p.id}><b>{p.productName}</b></Link></td><td>{p.category}</td><td>{p.farmerName}<div className="small muted">{p.farmName}</div></td><td>{inr(p.price)}/{p.unit}</td><td>{p.quantity <= 0 ? <span className="badge red">Out</span> : p.quantity + " " + p.unit}</td><td className="small">{p.lotId}</td>
          <td><button className="btn btn-danger btn-sm" onClick={() => del(p)}>Delete</button></td></tr>)}
      </Table>
    </div>
  );
}

export function AdminCategories() {
  const toast = useToast();
  const [d, reload] = useLists(["/categories"]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  if (!d) return <Loading />;
  const save = async (e) => {
    e.preventDefault(); setErr("");
    try { form.id ? await api.put("/categories/" + form.id, form) : await api.post("/categories", form); toast("Category saved ✓"); setForm(null); reload(); } catch (ex) { setErr(ex.message); }
  };
  const del = async (c) => { if (window.confirm("Delete category " + c.name + "?")) { await api.del("/categories/" + c.id); reload(); } };
  const list = [...d[0]].sort((a, b) => a.id - b.id);
  return (
    <div>
      <div className="row between mb"><h2>🗂️ Categories</h2><button className="btn btn-primary" onClick={() => { setForm({ name: "", icon: "🌿", description: "" }); setErr(""); }}>+ Add Category</button></div>
      <Table head={["ID", "Icon", "Name", "Description", ""]}>
        {list.map((c) => <tr key={c.id}><td>{c.id}</td><td style={{ fontSize: 26 }}>{c.icon}</td><td><b>{c.name}</b></td><td>{c.description}</td><td><div className="row"><button className="btn btn-ghost btn-sm" onClick={() => { setForm(c); setErr(""); }}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => del(c)}>Delete</button></div></td></tr>)}
      </Table>
      {form && (
        <Modal title={form.id ? "Edit category" : "Add category"} onClose={() => setForm(null)}>
          {err && <div className="alert alert-err">{err}</div>}
          <form onSubmit={save}><div className="form-grid">
            <div><label className="f">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="f">Icon (emoji)</label><input required value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
            <div className="full"><label className="f">Description</label><input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div><button className="btn btn-primary btn-block mt">Save</button></form>
        </Modal>)}
    </div>
  );
}

export function AdminOrders() {
  const [d] = useLists(["/orders"]);
  if (!d) return <Loading />;
  return (
    <div><div className="row between mb"><h2>🧾 All Orders</h2><button className="btn btn-outline btn-sm" onClick={() => {
        const csv = ["Order,Date,Buyer,Farmer,Total,Status", ...d[0].map((o) => [o.id, o.orderDate, `"${o.buyerName}"`, `"${o.farmerName}"`, o.totalAmount, o.status].join(","))].join("\n");
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "agrochain-orders.csv"; a.click(); URL.revokeObjectURL(a.href);
      }}>⬇ Export CSV</button></div>
      <Table head={["#", "Date", "Buyer", "Farmer", "Total", "Status", ""]}>
        {d[0].map((o) => <tr key={o.id}><td>{o.id}</td><td>{fmtDate(o.orderDate)}</td><td>{o.buyerName}</td><td>{o.farmerName}</td><td><b>{inr(o.totalAmount)}</b></td><td><StatusBadge status={o.status} /></td><td><Link to={"/orders/" + o.id} className="btn btn-ghost btn-sm">View</Link></td></tr>)}
      </Table></div>
  );
}

export function AdminReviews() {
  const toast = useToast();
  const [d, reload] = useLists(["/reviews"]);
  if (!d) return <Loading />;
  const del = async (r) => { if (window.confirm("Delete this review?")) { await api.del("/reviews/" + r.id); toast("Review deleted"); reload(); } };
  return (
    <div><h2 className="mb">⭐ All Reviews</h2>
      <Table head={["Date", "Buyer", "Product", "Rating", "Comment", ""]}>
        {d[0].map((r) => <tr key={r.id}><td>{fmtDate(r.reviewDate)}</td><td>{r.buyerName}</td><td>{r.productName}</td><td><span className="stars">{"★".repeat(r.rating)}</span></td><td style={{ maxWidth: 300 }}>{r.comment}</td><td><button className="btn btn-danger btn-sm" onClick={() => del(r)}>Delete</button></td></tr>)}
      </Table></div>
  );
}

export function AdminMarket() {
  const [d] = useLists(["/requirements", "/contracts", "/harvests"]);
  const [tab, setTab] = useState("req");
  if (!d) return <Loading />;
  const [reqs, contracts, harvests] = d;
  return (
    <div><h2 className="mb">📋 Marketplace Listings</h2>
      <div className="tabs">{[["req", `Bulk Requirements (${reqs.length})`], ["con", `Contract Requests (${contracts.length})`], ["har", `Future Harvests (${harvests.length})`]].map(([k, l]) => <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "req" && <Table head={["#", "Company", "Product", "Quantity", "Max price", "Required", "Status"]}>{reqs.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.companyName}</td><td><Link to={"/requirements/" + r.id}><b>{r.productName}</b></Link></td><td>{r.quantity} KG</td><td>{inr(r.maximumPrice)}</td><td>{fmtDate(r.requiredDate)}</td><td><StatusBadge status={r.status} /></td></tr>)}</Table>}
      {tab === "con" && <Table head={["#", "Company", "Crop", "Quantity", "Price", "Required", "Status"]}>{contracts.map((c) => <tr key={c.id}><td>{c.id}</td><td>{c.companyName}</td><td><b>{c.cropName}</b></td><td>{c.quantity} KG</td><td>{inr(c.price)}</td><td>{fmtDate(c.requiredDate)}</td><td><StatusBadge status={c.status} /></td></tr>)}</Table>}
      {tab === "har" && <Table head={["#", "Farmer", "Crop", "Available / Expected", "Price", "Harvest", "Status"]}>{harvests.map((h) => <tr key={h.id}><td>{h.id}</td><td>{h.farmName}</td><td><Link to={"/harvests/" + h.id}><b>{h.cropName}</b></Link></td><td>{h.availableQuantity} / {h.expectedQuantity} KG</td><td>{inr(h.expectedPrice)}</td><td>{fmtDate(h.harvestDate)}</td><td><StatusBadge status={h.status} /></td></tr>)}</Table>}
    </div>
  );
}
