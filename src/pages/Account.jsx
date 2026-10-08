import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast, useUser } from "../context/Contexts.jsx";
import { FARMING_TYPES, STATES } from "../data/catalog.js";
import { fmtDate } from "../utils.js";
import { EmptyState, Loading, StatusBadge } from "../components/Common.jsx";

const ICON = { Order: "📦", Review: "⭐", Requirement: "📝", Harvest: "🌱", Contract: "📃", Verification: "✅" };

export function Notifications() {
  const { user } = useUser();
  const toast = useToast();
  const [list, setList] = useState(null);
  const load = () => api.get("/notifications?userId=" + user.id).then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []); // eslint-disable-line
  const read = async (n) => { await api.put("/notifications/" + n.id, { status: "Read" }); load(); };
  const readAll = async () => { await Promise.all(list.filter((n) => n.status === "Unread").map((n) => api.put("/notifications/" + n.id, { status: "Read" }))); toast("All marked as read"); load(); };
  const del = async (n) => { await api.del("/notifications/" + n.id); load(); };
  if (!list) return <Loading />;
  return (
    <div>
      <div className="row between mb"><h2>🔔 Notifications</h2>{list.some((n) => n.status === "Unread") && <button className="btn btn-outline btn-sm" onClick={readAll}>Mark all as read</button>}</div>
      {list.length === 0 ? <EmptyState icon="🔔" title="You're all caught up" text="New updates will appear here." /> : (
        <div className="grid">{list.map((n) => (
          <div key={n.id} className={"notif" + (n.status === "Unread" ? " unread" : "")}>
            <span style={{ fontSize: 26 }}>{ICON[n.type] || "🔔"}</span>
            <div style={{ flex: 1 }}><div>{n.message}</div><div className="small muted">{fmtDate(n.createdDate)} {n.status === "Unread" && <StatusBadge status="Unread" />}</div></div>
            <div className="row">{n.status === "Unread" && <button className="btn btn-ghost btn-sm" onClick={() => read(n)}>Mark read</button>}<button className="icon-btn" onClick={() => del(n)}>🗑</button></div>
          </div>))}</div>)}
    </div>
  );
}

export function Profile() {
  const { user, farmer, patch } = useUser();
  const toast = useToast();
  const [u, setU] = useState({ name: user.name, phone: user.phone || "", location: user.location || "", password: "" });
  const [f, setF] = useState(farmer ? { farmName: farmer.farmName, farmSize: farmer.farmSize, village: farmer.village, district: farmer.district, state: farmer.state, experience: farmer.experience, farmingType: farmer.farmingType, mainCrops: farmer.mainCrops, about: farmer.about || "", imageUrl: farmer.imageUrl || "" } : null);
  const [err, setErr] = useState("");

  const save = async (e) => {
    e.preventDefault(); setErr("");
    try {
      const body = { name: u.name, phone: u.phone, location: u.location };
      if (u.password) body.password = u.password;
      const nu = await api.put("/users/" + user.id, body);
      let nf = farmer;
      if (farmer) nf = await api.put("/farmers/" + farmer.id, { ...f, farmSize: Number(f.farmSize), experience: Number(f.experience), name: u.name, phone: u.phone, location: f.village + ", " + f.state });
      patch({ user: nu, farmer: nf }); setU({ ...u, password: "" }); toast("Profile updated ✓");
    } catch (ex) { setErr(ex.message); }
  };
  const su = (k) => (e) => setU({ ...u, [k]: e.target.value });
  const sf = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <h2 className="mb">👤 My Profile</h2>
      <form className="card" onSubmit={save}>
        {err && <div className="alert alert-err">{err}</div>}
        <div className="row mb"><span className="badge">{user.role}</span>{farmer && <StatusBadge status={farmer.verificationStatus} />}<span className="muted small">{user.email}</span></div>
        <div className="form-grid">
          <div><label className="f">Name</label><input required value={u.name} onChange={su("name")} /></div>
          <div><label className="f">Phone</label><input value={u.phone} onChange={su("phone")} /></div>
          {!farmer && <div><label className="f">Location</label><input value={u.location} onChange={su("location")} /></div>}
          <div><label className="f">New password (optional)</label><input type="password" minLength={4} value={u.password} onChange={su("password")} placeholder="Leave blank to keep" /></div>
          {f && (<>
            <div><label className="f">Farm name</label><input required value={f.farmName} onChange={sf("farmName")} /></div>
            <div><label className="f">Farm size (acres)</label><input type="number" step="0.1" value={f.farmSize} onChange={sf("farmSize")} /></div>
            <div><label className="f">Village</label><input value={f.village} onChange={sf("village")} /></div>
            <div><label className="f">District</label><input value={f.district} onChange={sf("district")} /></div>
            <div><label className="f">State</label><select value={f.state} onChange={sf("state")}>{[...new Set([...STATES, f.state])].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="f">Experience (years)</label><input type="number" value={f.experience} onChange={sf("experience")} /></div>
            <div><label className="f">Farming type</label><select value={f.farmingType} onChange={sf("farmingType")}>{FARMING_TYPES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="f">Main crops</label><input value={f.mainCrops} onChange={sf("mainCrops")} /></div>
            <div className="full"><label className="f">About your farm</label><textarea value={f.about} onChange={sf("about")} /></div>
          </>)}
        </div>
        <button className="btn btn-primary mt">Save changes</button>
      </form>
    </div>
  );
}
