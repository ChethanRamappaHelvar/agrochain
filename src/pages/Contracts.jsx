import { useEffect, useState } from "react";
import { Link } from "../router.jsx";
import { api } from "../api.js";
import { useToast, useUser } from "../context/Contexts.jsx";
import { fmtDate, inr, today } from "../utils.js";
import { EmptyState, ErrorBox, Loading, Modal, PageHeader, StatusBadge } from "../components/Common.jsx";

export function Contracts() {
  const { user, farmer } = useUser();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [apply, setApply] = useState(null);
  const [f, setF] = useState({ farmSize: "", availableQuantity: "", proposedPrice: "", harvestDate: today() });
  const [err, setErr] = useState("");
  useEffect(() => { api.get("/contracts").then(setList).catch((e) => setErr(e.message)); }, []);
  const canApply = user?.role === "FARMER" && farmer?.verificationStatus === "Verified";

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api.post("/contract-applications", { contractId: apply.id, farmerId: farmer.id, farmerName: user.name, farmSize: Number(f.farmSize), location: farmer.location, cropName: apply.cropName, availableQuantity: Number(f.availableQuantity), proposedPrice: Number(f.proposedPrice), harvestDate: f.harvestDate });
      toast("Application submitted ✓"); setApply(null);
    } catch (ex) { setErr(ex.message); }
  };
  return (
    <>
      <PageHeader title="📃 Contract Farming" subtitle="Companies publish future crop requirements - farmers apply"><>{user?.role === "BUSINESS" && <Link to="/business/contracts" className="btn btn-amber">+ Publish Contract</Link>}</></PageHeader>
      <div className="container page">
        <ErrorBox message={err && !apply ? err : ""} />
        {!list ? !err && <Loading /> : list.length === 0 ? <EmptyState icon="📃" title="No contract requests" /> : (
          <div className="grid g2">{list.map((c) => (
            <div className="card hover" key={c.id}>
              <div className="row between"><span className="badge blue">{c.companyName}</span><StatusBadge status={c.status} /></div>
              <h2 className="mt-s">{c.cropName}</h2><p className="muted small">{c.description}</p>
              <dl className="kv mt-s"><dt>Quantity</dt><dd><b>{c.quantity.toLocaleString("en-IN")} KG</b></dd><dt>Expected price</dt><dd>{inr(c.price)}/KG</dd><dt>Required</dt><dd>{fmtDate(c.requiredDate)}</dd><dt>Location</dt><dd>📍 {c.location}</dd></dl>
              {canApply && c.status === "Open" && <button className="btn btn-primary mt" onClick={() => { setApply(c); setErr(""); setF({ farmSize: farmer.farmSize || "", availableQuantity: "", proposedPrice: c.price, harvestDate: c.requiredDate }); }}>Apply for Contract</button>}
            </div>))}</div>
        )}
        {user?.role === "FARMER" && !canApply && <div className="alert alert-warn mt">Verified farmers only can apply for contract farming.</div>}
        {!user && <div className="alert alert-info mt"><Link to="/login" className="bold">Login</Link> as a farmer to apply.</div>}
      </div>
      {apply && (
        <Modal title={"Apply: " + apply.cropName} onClose={() => setApply(null)}>
          {err && <div className="alert alert-err">{err}</div>}
          <form onSubmit={submit}><div className="form-grid">
            <div><label className="f">Farm size (acres)</label><input type="number" required value={f.farmSize} onChange={(e) => setF({ ...f, farmSize: e.target.value })} /></div>
            <div><label className="f">Expected quantity (KG)</label><input type="number" required min="1" value={f.availableQuantity} onChange={(e) => setF({ ...f, availableQuantity: e.target.value })} /></div>
            <div><label className="f">Proposed price (₹/KG)</label><input type="number" required min="1" value={f.proposedPrice} onChange={(e) => setF({ ...f, proposedPrice: e.target.value })} /></div>
            <div><label className="f">Expected harvest date</label><input type="date" required value={f.harvestDate} onChange={(e) => setF({ ...f, harvestDate: e.target.value })} /></div>
          </div><button className="btn btn-primary btn-block mt">Submit Application</button></form>
        </Modal>)}
    </>
  );
}

const blank = { cropName: "", quantity: "", price: "", requiredDate: today(), location: "", description: "" };

export function ManageContracts() {
  const { user } = useUser();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState(null);
  const [view, setView] = useState(null);
  const [err, setErr] = useState("");
  const load = () => Promise.all([api.get("/contracts?companyId=" + user.id), api.get("/contract-applications")]).then(([c, a]) => { setList(c); setApps(a); });
  useEffect(() => { load(); }, []); // eslint-disable-line
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr("");
    const body = { ...form, quantity: Number(form.quantity), price: Number(form.price) };
    try {
      if (form.id) await api.put("/contracts/" + form.id, body); else await api.post("/contracts", { ...body, companyId: user.id, companyName: user.name });
      toast("Contract saved ✓"); setForm(null); load();
    } catch (ex) { setErr(ex.message); }
  };
  const decide = async (a, status) => { await api.put("/contract-applications/" + a.id, { status }); toast("Application " + status.toLowerCase()); load(); };
  if (!list) return <Loading />;
  const viewApps = view ? apps.filter((a) => a.contractId === view.id) : [];
  return (
    <div>
      <div className="row between mb"><h2>📃 My Contract Requests</h2><button className="btn btn-primary" onClick={() => { setForm(blank); setErr(""); }}>+ Publish Contract</button></div>
      {list.length === 0 ? <EmptyState icon="📃" title="No contracts published" text="Publish a future crop requirement for farmers."/> : (
        <div className="table-wrap"><table><thead><tr><th>Crop</th><th>Quantity</th><th>Price</th><th>Required</th><th>Applications</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((c) => <tr key={c.id}><td><b>{c.cropName}</b></td><td>{c.quantity} KG</td><td>{inr(c.price)}</td><td>{fmtDate(c.requiredDate)}</td>
            <td><button className="badge blue" style={{ border: 0, cursor: "pointer" }} onClick={() => setView(c)}>{apps.filter((a) => a.contractId === c.id).length} applications</button></td><td><StatusBadge status={c.status} /></td>
            <td><div className="row"><button className="btn btn-ghost btn-sm" onClick={() => { setForm(c); setErr(""); }}>Edit</button><button className="btn btn-danger btn-sm" onClick={async () => { if (window.confirm("Delete contract?")) { await api.del("/contracts/" + c.id); load(); } }}>Delete</button></div></td></tr>)}</tbody></table></div>)}
      {form && (
        <Modal title={form.id ? "Edit contract" : "Publish contract"} onClose={() => setForm(null)}>
          {err && <div className="alert alert-err">{err}</div>}
          <form onSubmit={save}><div className="form-grid">
            <div><label className="f">Crop</label><input required value={form.cropName} onChange={set("cropName")} placeholder="Organic Turmeric" /></div>
            <div><label className="f">Quantity (KG)</label><input type="number" required min="1" value={form.quantity} onChange={set("quantity")} /></div>
            <div><label className="f">Expected price (₹/KG)</label><input type="number" required min="1" value={form.price} onChange={set("price")} /></div>
            <div><label className="f">Required by</label><input type="date" required value={form.requiredDate} onChange={set("requiredDate")} /></div>
            <div className="full"><label className="f">Location</label><input required value={form.location} onChange={set("location")} /></div>
            <div className="full"><label className="f">Description</label><textarea value={form.description || ""} onChange={set("description")} /></div>
            {form.id && <div className="full"><label className="f">Status</label><select value={form.status} onChange={set("status")}><option>Open</option><option>Closed</option></select></div>}
          </div><button className="btn btn-primary btn-block mt">Save</button></form>
        </Modal>)}
      {view && (
        <Modal title={"Applications: " + view.cropName} onClose={() => setView(null)}>
          {viewApps.length === 0 ? <div className="muted">No applications yet.</div> : viewApps.map((a) => (
            <div className="card mb" key={a.id}><div className="row between"><Link to={"/farmers/" + a.farmerId}><b>{a.farmerName}</b></Link><StatusBadge status={a.status} /></div>
              <div className="small muted">{a.farmSize} acres • {a.location}</div><div className="small">{a.availableQuantity} KG at {inr(a.proposedPrice)}/KG • harvest {fmtDate(a.harvestDate)}</div>
              {a.status === "Pending" && <div className="row mt-s"><button className="btn btn-primary btn-sm" onClick={() => decide(a, "Selected")}>Select</button><button className="btn btn-ghost btn-sm" onClick={() => decide(a, "Rejected")}>Reject</button></div>}</div>))}
        </Modal>)}
    </div>
  );
}
