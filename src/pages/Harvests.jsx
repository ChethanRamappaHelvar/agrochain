import { useEffect, useState } from "react";
import { Link, useParams } from "../router.jsx";
import { api } from "../api.js";
import { useToast, useUser } from "../context/Contexts.jsx";
import { fmtDate, inr } from "../utils.js";
import { EmptyState, ErrorBox, Loading, PageHeader, StatusBadge } from "../components/Common.jsx";

export function HarvestCard({ h }) {
  const pct = Math.max(0, Math.min(100, 100 - (h.availableQuantity / h.expectedQuantity) * 100));
  return (
    <div className="card hover">
      <div className="row between"><span className="badge amber">🌱 Coming Soon</span><StatusBadge status={h.status} /></div>
      <h3 className="mt-s">{h.cropName} {h.farmingType === "Organic" && <span className="badge">🌿 Organic</span>}</h3>
      <div className="muted small">by <Link to={"/farmers/" + h.farmerId} style={{ color: "var(--green)" }}>{h.farmName}</Link> • 📍 {h.location}</div>
      <div className="row between mt-s"><span><b>{h.availableQuantity.toLocaleString("en-IN")}</b> / {h.expectedQuantity.toLocaleString("en-IN")} KG left</span><span className="price">{inr(h.expectedPrice)}<small>/KG</small></span></div>
      <div className="bar mt-s"><i style={{ width: pct + "%" }} /></div>
      <div className="small muted mt-s">Expected harvest: <b>{fmtDate(h.harvestDate)}</b> • {Math.round(pct)}% booked</div>
      <Link to={"/harvests/" + h.id} className="btn btn-primary btn-sm mt">{h.status === "Open" ? "Reserve Harvest" : "View Details"}</Link>
    </div>
  );
}

export function Harvests() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { api.get("/harvests").then(setList).catch((e) => setErr(e.message)); }, []);
  const shown = (list || []).filter((h) => h.cropName.toLowerCase().includes(q.toLowerCase()) || (h.location || "").toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="🌱 Future Harvest Marketplace" subtitle="Buy crops before they are harvested - guaranteed supply, fair price">
        <Link to="/calendar" className="btn btn-amber">📅 Harvest Calendar</Link>
      </PageHeader>
      <div className="container page">
        <ErrorBox message={err} />
        <input placeholder="🔍 Search crop or location" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420, borderRadius: 999 }} className="mb" />
        {!list ? !err && <Loading /> : shown.length === 0 ? <EmptyState icon="🌱" title="No upcoming harvests" /> : <div className="grid g3">{shown.map((h) => <HarvestCard key={h.id} h={h} />)}</div>}
      </div>
    </>
  );
}

export function HarvestDetails() {
  const { id } = useParams();
  const { user } = useUser();
  const toast = useToast();
  const [h, setH] = useState(null);
  const [qty, setQty] = useState("");
  const [err, setErr] = useState("");
  const [bookings, setBookings] = useState([]);
  const load = () => {
    api.get("/harvests/" + id).then(setH).catch((e) => setErr(e.message));
    api.get("/harvest-bookings?harvestId=" + id).then(setBookings).catch(() => {});
  };
  useEffect(load, [id]); // eslint-disable-line
  if (err && !h) return <div className="container page"><ErrorBox message={err} /></div>;
  if (!h) return <Loading />;
  const canReserve = user && (user.role === "BUYER" || user.role === "BUSINESS") && h.status === "Open";

  const reserve = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api.post("/harvest-bookings", { harvestId: h.id, buyerId: user.id, buyerName: user.name, quantity: Number(qty) });
      toast("Harvest reserved! 🌱"); setQty(""); load();
    } catch (ex) { setErr(ex.message); }
  };

  return (
    <div className="container page">
      <div className="small muted mb"><Link to="/harvests">Future Harvests</Link> / <b>{h.cropName}</b></div>
      <div className="grid g2" style={{ alignItems: "start" }}>
        <div className="card">
          <span className="badge amber">🌱 Upcoming Harvest</span> <StatusBadge status={h.status} />
          <h1 className="mt-s">{h.cropName}</h1>
          <p className="muted mt-s">{h.description}</p>
          <dl className="kv mt">
            <dt>Farmer</dt><dd><Link to={"/farmers/" + h.farmerId} style={{ color: "var(--green)" }}>{h.farmerName} ({h.farmName})</Link></dd>
            <dt>Location</dt><dd>📍 {h.location}</dd><dt>Farming type</dt><dd>{h.farmingType}</dd>
            <dt>Harvest date</dt><dd><b>{fmtDate(h.harvestDate)}</b></dd><dt>Expected quantity</dt><dd>{h.expectedQuantity.toLocaleString("en-IN")} KG</dd>
            <dt>Still available</dt><dd><b>{h.availableQuantity.toLocaleString("en-IN")} KG</b></dd><dt>Expected price</dt><dd className="price">{inr(h.expectedPrice)}/KG</dd>
          </dl>
        </div>
        <div className="card">
          <h3 className="mb">Reserve this harvest</h3>
          {err && <div className="alert alert-err">{err}</div>}
          {!user ? <div className="alert alert-info">Please <Link to="/login" className="bold">login</Link> as a buyer or business to reserve.</div>
            : !canReserve ? <div className="alert alert-warn">{h.status !== "Open" ? "This harvest is fully booked." : "Only buyer and business accounts can reserve harvests."}</div> : (
            <form onSubmit={reserve}>
              <label className="f">Required quantity (KG)</label>
              <input type="number" min="1" max={h.availableQuantity} required value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 1000" />
              {qty > 0 && <div className="mt-s muted">Estimated value: <b>{inr(qty * h.expectedPrice)}</b></div>}
              <button className="btn btn-primary btn-block mt">Reserve Harvest</button>
            </form>)}
          {user && user.role === "BUYER" || user?.role === "BUSINESS" ? <Link to="/reservations" className="btn btn-ghost btn-block mt-s">View my reservations</Link> : null}
        </div>
      </div>
      <h3 className="mt mb">Reservations on this harvest: {bookings.length}</h3>
    </div>
  );
}

export function HarvestCalendar() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get("/harvests").then(setList).catch(() => setList([])); }, []);
  if (!list) return <Loading />;
  // group by month using reduce() + sort()
  const groups = list.reduce((acc, h) => { const k = (h.harvestDate || "").slice(0, 7); (acc[k] = acc[k] || []).push(h); return acc; }, {});
  const months = Object.keys(groups).sort();
  return (
    <>
      <PageHeader title="📅 Harvest Calendar" subtitle="Plan your purchases month by month"><Link to="/harvests" className="btn btn-amber">Back to harvests</Link></PageHeader>
      <div className="container page">
        {months.length === 0 ? <EmptyState icon="📅" title="No harvests scheduled" /> : (
          <div className="grid g3">
            {months.map((m) => (
              <div className="cal" key={m}>
                <h4>{new Date(m + "-01T00:00:00").toLocaleString("en-IN", { month: "long", year: "numeric" })}</h4>
                <ul>{groups[m].map((h) => <li key={h.id}><Link to={"/harvests/" + h.id}><b>{h.cropName}</b></Link> — {h.farmName}<br /><span className="muted small">{fmtDate(h.harvestDate)} • {h.availableQuantity.toLocaleString("en-IN")} KG • {inr(h.expectedPrice)}/KG</span></li>)}</ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function Reservations() {
  const { user } = useUser();
  const toast = useToast();
  const [list, setList] = useState(null);
  const load = () => api.get("/harvest-bookings?buyerId=" + user.id).then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const cancel = async (b) => { if (!window.confirm("Cancel this reservation?")) return; try { await api.put("/harvest-bookings/" + b.id, { status: "Cancelled" }); toast("Reservation cancelled"); load(); } catch (e) { toast(e.message, "error"); } };
  if (!list) return <Loading />;
  return (
    <div>
      <h2 className="mb">🌱 Harvest Reservations</h2>
      {list.length === 0 ? <EmptyState icon="🌱" title="No reservations yet" text="Reserve upcoming crops before harvest."><Link to="/harvests" className="btn btn-primary">Explore harvests</Link></EmptyState> : (
        <div className="table-wrap"><table><thead><tr><th>#</th><th>Crop</th><th>Quantity</th><th>Price/KG</th><th>Booked</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((b) => <tr key={b.id}><td>{b.id}</td><td><Link to={"/harvests/" + b.harvestId}><b>{b.cropName}</b></Link></td><td>{b.quantity} KG</td><td>{inr(b.price)}</td><td>{fmtDate(b.bookingDate)}</td><td><StatusBadge status={b.status} /></td>
            <td>{b.status === "Reserved" && <button className="btn btn-ghost btn-sm" onClick={() => cancel(b)}>Cancel</button>}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
