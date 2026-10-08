import { useEffect, useState } from "react";
import { Link } from "../router.jsx";
import { api } from "../api.js";
import { useFav, useUser } from "../context/Contexts.jsx";
import { fmtDate, inr, today } from "../utils.js";
import { Donut, Loading, StatCard, StatusBadge } from "../components/Common.jsx";
import { WeatherWidget } from "./Weather.jsx";
import { AdminDashboard } from "./Admin.jsx";

export default function Dashboard() {
  const { user } = useUser();
  if (user.role === "ADMIN") return <AdminDashboard />;
  if (user.role === "FARMER") return <FarmerDash />;
  if (user.role === "BUSINESS") return <BusinessDash />;
  return <BuyerDash />;
}

function FarmerDash() {
  const { user, farmer, patch } = useUser();
  const [d, setD] = useState(null);
  useEffect(() => {
    Promise.all([api.get("/farmers/" + farmer.id), api.get("/products?farmerId=" + farmer.id), api.get("/orders?farmerId=" + farmer.id), api.get("/harvests?farmerId=" + farmer.id), api.get("/requirements")])
      .then(([f, products, orders, harvests, reqs]) => { setD({ products, orders, harvests, reqs }); if (f.verificationStatus !== farmer.verificationStatus) patch({ farmer: f }); })
      .catch(() => setD({ products: [], orders: [], harvests: [], reqs: [] }));
  }, []); // eslint-disable-line
  if (!d) return <Loading />;
  const done = d.orders.filter((o) => o.status === "Delivered");
  const revenue = done.reduce((s, o) => s + o.totalAmount, 0);
  const pending = d.orders.filter((o) => o.status === "Order Placed").length;
  const low = d.products.filter((p) => p.quantity < 50);
  return (
    <div>
      <h2 className="mb">Welcome, {user.name} 👋</h2>
      {farmer.verificationStatus === "Pending" && <div className="alert alert-warn">⏳ Your account is <b>pending verification</b> by the admin. You can list products once verified.</div>}
      {farmer.verificationStatus === "Rejected" && <div className="alert alert-err">❌ Your verification was rejected. Update your <Link to="/profile" className="bold">profile</Link> and contact support.</div>}
      {farmer.verificationStatus === "Verified" && <div className="alert alert-ok">✓ Verified Farmer — buyers can trust your listings.</div>}
      <div className="grid g3">
        <StatCard icon="🧺" label="Total Products" value={d.products.length} /><StatCard icon="🧾" label="Total Orders" value={d.orders.length} /><StatCard icon="⏳" label="Pending Orders" value={pending} />
        <StatCard icon="💰" label="Total Revenue" value={inr(revenue)} /><StatCard icon="🌱" label="Future Harvests" value={d.harvests.length} /><StatCard icon="📝" label="Open Bulk Requests" value={d.reqs.filter((r) => r.status === "Open").length} />
      </div>
      <div className="card mt"><h3 className="mb">Orders by status</h3>
        <Donut center={d.orders.length} data={[["Order Placed", "#e8523f"], ["Accepted", "#f2a33a"], ["Preparing", "#e6c229"], ["Dispatched", "#2b6cb0"], ["Delivered", "#0f9d94"], ["Cancelled", "#8a99a0"]].map(([label, color]) => ({ label, color, value: d.orders.filter((o) => o.status === label).length }))} /></div>
      <div className="grid g2 mt" style={{ alignItems: "start" }}>
        <div className="card"><div className="row between"><h3>Recent Orders</h3><Link to="/orders" className="btn btn-outline btn-sm">All</Link></div>
          {d.orders.length === 0 ? <p className="muted mt-s">No orders yet.</p> : d.orders.slice(0, 5).map((o) => <div className="row between mt-s" key={o.id}><span><b>#{o.id}</b> {o.buyerName}<div className="small muted">{fmtDate(o.orderDate)} • {inr(o.totalAmount)}</div></span><StatusBadge status={o.status} /></div>)}</div>
        <div className="card"><div className="row between"><h3>Stock Alerts</h3><Link to="/inventory" className="btn btn-outline btn-sm">Inventory</Link></div>
          {low.length === 0 ? <p className="muted mt-s">All products are well stocked ✓</p> : low.map((p) => <div className="row between mt-s" key={p.id}><b>{p.productName}</b>{p.quantity <= 0 ? <span className="badge red">OUT OF STOCK</span> : <span className="badge amber">⚠ Only {p.quantity} {p.unit} left</span>}</div>)}</div>
      </div>
      <div className="grid g2 mt" style={{ alignItems: "start" }}>
        <WeatherWidget city={farmer.village || "Anekal"} />
        <div className="card"><h3>Quick actions</h3><div className="row mt"><Link className="btn btn-primary btn-sm" to="/farmer/products">+ Add Product</Link><Link className="btn btn-primary btn-sm" to="/farmer/harvests">+ Future Harvest</Link><Link className="btn btn-outline btn-sm" to="/requirements">Bulk Requirements</Link><Link className="btn btn-outline btn-sm" to="/contracts">Contracts</Link><Link className="btn btn-outline btn-sm" to="/market">Market Prices</Link></div></div>
      </div>
    </div>
  );
}

function BuyerDash() {
  const { user } = useUser();
  const { fav } = useFav();
  const [d, setD] = useState(null);
  useEffect(() => { Promise.all([api.get("/orders?buyerId=" + user.id), api.get("/harvest-bookings?buyerId=" + user.id)]).then(([orders, bookings]) => setD({ orders, bookings })).catch(() => setD({ orders: [], bookings: [] })); }, []); // eslint-disable-line
  if (!d) return <Loading />;
  return (
    <div>
      <h2 className="mb">Hello, {user.name} 👋</h2>
      <div className="grid g3">
        <StatCard icon="🧾" label="Total Orders" value={d.orders.length} /><StatCard icon="🚚" label="Active Orders" value={d.orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length} /><StatCard icon="✅" label="Delivered Orders" value={d.orders.filter((o) => o.status === "Delivered").length} />
        <StatCard icon="❤️" label="Favorite Products" value={fav.products.length} /><StatCard icon="👨‍🌾" label="Favorite Farmers" value={fav.farmers.length} /><StatCard icon="🌱" label="Harvest Reservations" value={d.bookings.length} />
      </div>
      <div className="card mt"><div className="row between"><h3>Recent Orders</h3><Link to="/orders" className="btn btn-outline btn-sm">View all</Link></div>
        {d.orders.length === 0 ? <p className="muted mt-s">No orders yet. <Link to="/products" className="bold" style={{ color: "var(--green)" }}>Start shopping →</Link></p> : d.orders.slice(0, 5).map((o) => <div className="row between mt-s" key={o.id}><span><b>#{o.id}</b> {o.farmerName}<div className="small muted">{fmtDate(o.orderDate)} • {inr(o.totalAmount)}</div></span><span className="row"><StatusBadge status={o.status} /><Link to={"/orders/" + o.id} className="btn btn-ghost btn-sm">Track</Link></span></div>)}</div>
      <div className="row mt"><Link className="btn btn-primary" to="/products">Browse Products</Link><Link className="btn btn-outline" to="/harvests">Future Harvests</Link><Link className="btn btn-outline" to="/farmers">Find Farmers</Link></div>
    </div>
  );
}

function BusinessDash() {
  const { user } = useUser();
  const [d, setD] = useState(null);
  useEffect(() => {
    Promise.all([api.get("/requirements?businessId=" + user.id), api.get("/requirement-responses"), api.get("/contracts?companyId=" + user.id), api.get("/orders?buyerId=" + user.id), api.get("/harvest-bookings?buyerId=" + user.id)])
      .then(([reqs, resps, contracts, orders, bookings]) => setD({ reqs, resps, contracts, orders, bookings })).catch(() => setD({ reqs: [], resps: [], contracts: [], orders: [], bookings: [] }));
  }, []); // eslint-disable-line
  if (!d) return <Loading />;
  const ids = d.reqs.map((r) => r.id);
  return (
    <div>
      <h2 className="mb">Hello, {user.name} 👋</h2>
      <div className="grid g3">
        <StatCard icon="📝" label="Bulk Requirements" value={d.reqs.length} /><StatCard icon="💼" label="Farmer Responses" value={d.resps.filter((r) => ids.includes(r.requirementId)).length} /><StatCard icon="📃" label="Active Contracts" value={d.contracts.filter((c) => c.status === "Open").length} />
        <StatCard icon="🧾" label="Orders" value={d.orders.length} /><StatCard icon="🌱" label="Harvest Reservations" value={d.bookings.length} /><StatCard icon="💰" label="Total Purchases" value={inr(d.orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.totalAmount, 0))} />
      </div>
      <div className="card mt"><div className="row between"><h3>My Requirements</h3><Link to="/business/requirements" className="btn btn-outline btn-sm">Manage</Link></div>
        {d.reqs.length === 0 ? <p className="muted mt-s">You have not posted any requirement.</p> : d.reqs.slice(0, 5).map((r) => <div className="row between mt-s" key={r.id}><span><b>{r.productName}</b> {r.quantity} KG<div className="small muted">by {fmtDate(r.requiredDate)}</div></span><Link to={"/requirements/" + r.id} className="badge blue">{d.resps.filter((x) => x.requirementId === r.id).length} offers</Link></div>)}</div>
      <div className="row mt"><Link className="btn btn-primary" to="/business/requirements">+ Post Requirement</Link><Link className="btn btn-outline" to="/business/contracts">+ Publish Contract</Link><Link className="btn btn-outline" to="/products">Buy Products</Link><Link className="btn btn-outline" to="/harvests">Reserve Harvest</Link></div>
    </div>
  );
}
