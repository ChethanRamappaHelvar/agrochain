import { useEffect, useState } from "react";
import { Link, useParams } from "../router.jsx";
import { api } from "../api.js";
import { useToast, useUser } from "../context/Contexts.jsx";
import { fmtDate, inr, today } from "../utils.js";
import { EmptyState, ErrorBox, Loading, Modal, PageHeader, StatusBadge } from "../components/Common.jsx";

function RespondModal({ req, onClose, onDone }) {
  const { user, farmer } = useUser();
  const toast = useToast();
  const [f, setF] = useState({ availableQuantity: "", proposedPrice: "", harvestDate: today() });
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/requirement-responses", { requirementId: req.id, farmerId: farmer.id, farmerName: user.name, availableQuantity: Number(f.availableQuantity), proposedPrice: Number(f.proposedPrice), harvestDate: f.harvestDate });
      toast("Offer submitted ✓"); onDone(); onClose();
    } catch (ex) { setErr(ex.message); }
  };
  return (
    <Modal title={"Respond: " + req.productName + " (" + req.quantity + " KG)"} onClose={onClose}>
      {err && <div className="alert alert-err">{err}</div>}
      <form onSubmit={submit}><div className="form-grid">
        <div><label className="f">Available quantity (KG)</label><input type="number" required min="1" value={f.availableQuantity} onChange={(e) => setF({ ...f, availableQuantity: e.target.value })} /></div>
        <div><label className="f">Expected price (₹/KG) — max {req.maximumPrice}</label><input type="number" required min="1" step="0.5" value={f.proposedPrice} onChange={(e) => setF({ ...f, proposedPrice: e.target.value })} /></div>
        <div className="full"><label className="f">Harvest / delivery date</label><input type="date" required value={f.harvestDate} onChange={(e) => setF({ ...f, harvestDate: e.target.value })} /></div>
      </div><button className="btn btn-primary btn-block mt">Submit Offer</button></form>
    </Modal>
  );
}

export function Requirements() {
  const { user, farmer } = useUser();
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const [resp, setResp] = useState(null);
  const [err, setErr] = useState("");
  const load = () => api.get("/requirements").then(setList).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const canRespond = user?.role === "FARMER" && farmer?.verificationStatus === "Verified";
  const shown = (list || []).filter((r) => r.productName.toLowerCase().includes(q.toLowerCase()) || r.companyName.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="🏢 Bulk Requirement Marketplace" subtitle="Businesses post what they need - farmers respond with offers">
        {user?.role === "BUSINESS" && <Link to="/business/requirements" className="btn btn-amber">+ Post Requirement</Link>}
      </PageHeader>
      <div className="container page">
        <ErrorBox message={err} />
        <input placeholder="🔍 Search product or company" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420, borderRadius: 999 }} className="mb" />
        {!list ? !err && <Loading /> : shown.length === 0 ? <EmptyState icon="📝" title="No requirements" /> : (
          <div className="grid g3">{shown.map((r) => (
            <div className="card hover" key={r.id}>
              <div className="row between"><span className="badge blue">{r.companyName}</span><StatusBadge status={r.status} /></div>
              <h3 className="mt-s">{r.productName}</h3>
              <div className="price">{r.quantity.toLocaleString("en-IN")} KG</div>
              <dl className="kv mt-s" style={{ gridTemplateColumns: "110px 1fr" }}><dt>Max price</dt><dd>{inr(r.maximumPrice)}/KG</dd><dt>Required by</dt><dd>{fmtDate(r.requiredDate)}</dd><dt>Location</dt><dd>📍 {r.location}</dd></dl>
              <div className="row mt">
                <Link to={"/requirements/" + r.id} className="btn btn-outline btn-sm">View Requirement</Link>
                {canRespond && r.status === "Open" && <button className="btn btn-primary btn-sm" onClick={() => setResp(r)}>Respond</button>}
              </div>
            </div>))}</div>
        )}
        {user?.role === "FARMER" && !canRespond && <div className="alert alert-warn mt">Your farmer account must be verified before you can respond to requirements.</div>}
      </div>
      {resp && <RespondModal req={resp} onClose={() => setResp(null)} onDone={load} />}
    </>
  );
}

export function RequirementDetails() {
  const { id } = useParams();
  const { user, farmer } = useUser();
  const toast = useToast();
  const [r, setR] = useState(null);
  const [resps, setResps] = useState([]);
  const [resp, setResp] = useState(false);
  const [err, setErr] = useState("");
  const load = () => {
    api.get("/requirements/" + id).then(setR).catch((e) => setErr(e.message));
    api.get("/requirement-responses?requirementId=" + id).then(setResps).catch(() => {});
  };
  useEffect(load, [id]); // eslint-disable-line
  if (err) return <div className="container page"><ErrorBox message={err} /></div>;
  if (!r) return <Loading />;
  const owner = user?.role === "BUSINESS" && user.id === r.businessId;
  const mine = farmer ? resps.filter((x) => x.farmerId === farmer.id) : [];
  const visible = owner ? [...resps].sort((a, b) => a.proposedPrice - b.proposedPrice) : mine;
  const decide = async (x, status) => { try { await api.put("/requirement-responses/" + x.id, { status }); toast("Offer " + status.toLowerCase()); load(); } catch (e) { toast(e.message, "error"); } };

  return (
    <div className="container page">
      <div className="small muted mb"><Link to="/requirements">Requirements</Link> / #{r.id}</div>
      <div className="card">
        <div className="row between"><h1>{r.productName} — {r.quantity.toLocaleString("en-IN")} KG</h1><StatusBadge status={r.status} /></div>
        <p className="muted mt-s">{r.description}</p>
        <dl className="kv mt"><dt>Company</dt><dd><b>{r.companyName}</b></dd><dt>Max price</dt><dd>{inr(r.maximumPrice)}/KG</dd><dt>Required by</dt><dd>{fmtDate(r.requiredDate)}</dd><dt>Delivery location</dt><dd>📍 {r.location}</dd></dl>
        {user?.role === "FARMER" && farmer?.verificationStatus === "Verified" && r.status === "Open" && <button className="btn btn-primary mt" onClick={() => setResp(true)}>Respond with an offer</button>}
        {!user && <div className="alert alert-info mt">Login as a verified farmer to respond.</div>}
      </div>
      {(owner || mine.length > 0) && (<>
        <h3 className="mt mb">{owner ? `Farmer offers (${resps.length}) — cheapest first` : "Your offers"}</h3>
        {visible.length === 0 ? <div className="muted">No offers yet.</div> : (
          <div className="table-wrap"><table><thead><tr><th>Farmer</th><th>Quantity</th><th>Price/KG</th><th>Harvest date</th><th>Total</th><th>Status</th>{owner && <th></th>}</tr></thead>
            <tbody>{visible.map((x) => <tr key={x.id}><td><Link to={"/farmers/" + x.farmerId}><b>{x.farmerName}</b></Link></td><td>{x.availableQuantity} KG</td><td>{inr(x.proposedPrice)}</td><td>{fmtDate(x.harvestDate)}</td><td>{inr(x.availableQuantity * x.proposedPrice)}</td><td><StatusBadge status={x.status} /></td>
              {owner && <td>{x.status === "Pending" && <div className="row"><button className="btn btn-primary btn-sm" onClick={() => decide(x, "Accepted")}>Select</button><button className="btn btn-ghost btn-sm" onClick={() => decide(x, "Rejected")}>Reject</button></div>}</td>}</tr>)}</tbody></table></div>)}
      </>)}
      {resp && <RespondModal req={r} onClose={() => setResp(false)} onDone={load} />}
    </div>
  );
}

const blank = { productName: "", quantity: "", maximumPrice: "", requiredDate: today(), location: "", description: "" };

export function ManageRequirements() {
  const { user } = useUser();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [resps, setResps] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const load = () => Promise.all([api.get("/requirements?businessId=" + user.id), api.get("/requirement-responses")]).then(([l, r]) => { setList(l); setResps(r); });
  useEffect(() => { load(); }, []); // eslint-disable-line
  const save = async (e) => {
    e.preventDefault(); setErr("");
    const body = { ...form, quantity: Number(form.quantity), maximumPrice: Number(form.maximumPrice) };
    try {
      if (form.id) await api.put("/requirements/" + form.id, body);
      else await api.post("/requirements", { ...body, businessId: user.id, companyName: user.name });
      toast("Requirement saved ✓"); setForm(null); load();
    } catch (ex) { setErr(ex.message); }
  };
  const del = async (r) => { if (window.confirm("Delete this requirement?")) { await api.del("/requirements/" + r.id); toast("Deleted"); load(); } };
  if (!list) return <Loading />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div>
      <div className="row between mb"><h2>📝 My Bulk Requirements</h2><button className="btn btn-primary" onClick={() => { setForm(blank); setErr(""); }}>+ Post Requirement</button></div>
      {list.length === 0 ? <EmptyState icon="📝" title="No requirements posted" text="Tell farmers what you need."><button className="btn btn-primary" onClick={() => setForm(blank)}>Post your first requirement</button></EmptyState> : (
        <div className="table-wrap"><table><thead><tr><th>Product</th><th>Quantity</th><th>Max price</th><th>Required</th><th>Offers</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((r) => <tr key={r.id}><td><b>{r.productName}</b></td><td>{r.quantity} KG</td><td>{inr(r.maximumPrice)}</td><td>{fmtDate(r.requiredDate)}</td><td><Link to={"/requirements/" + r.id} className="badge blue">{resps.filter((x) => x.requirementId === r.id).length} offers</Link></td><td><StatusBadge status={r.status} /></td>
            <td><div className="row"><button className="btn btn-ghost btn-sm" onClick={() => { setForm(r); setErr(""); }}>Edit</button><button className="btn btn-ghost btn-sm" onClick={() => api.put("/requirements/" + r.id, { status: r.status === "Open" ? "Closed" : "Open" }).then(load)}>{r.status === "Open" ? "Close" : "Reopen"}</button><button className="btn btn-danger btn-sm" onClick={() => del(r)}>Delete</button></div></td></tr>)}</tbody></table></div>
      )}
      {form && (
        <Modal title={form.id ? "Edit requirement" : "Post requirement"} onClose={() => setForm(null)}>
          {err && <div className="alert alert-err">{err}</div>}
          <form onSubmit={save}><div className="form-grid">
            <div><label className="f">Product</label><input required value={form.productName} onChange={set("productName")} placeholder="Tomato" /></div>
            <div><label className="f">Quantity (KG)</label><input type="number" required min="1" value={form.quantity} onChange={set("quantity")} /></div>
            <div><label className="f">Maximum price (₹/KG)</label><input type="number" required min="1" value={form.maximumPrice} onChange={set("maximumPrice")} /></div>
            <div><label className="f">Required date</label><input type="date" required value={form.requiredDate} onChange={set("requiredDate")} /></div>
            <div className="full"><label className="f">Delivery location</label><input required value={form.location} onChange={set("location")} /></div>
            <div className="full"><label className="f">Description</label><textarea value={form.description || ""} onChange={set("description")} /></div>
          </div><button className="btn btn-primary btn-block mt">Save</button></form>
        </Modal>)}
    </div>
  );
}
