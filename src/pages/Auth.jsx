import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "../router.jsx";
import { api } from "../api.js";
import { useToast, useUser } from "../context/Contexts.jsx";
import { BUSINESS_TYPES, FARMING_TYPES, STATES } from "../data/catalog.js";

export function Login() {
  const { user, login } = useUser();
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const s = await api.post("/auth/login", { email, password });
      login(s); toast("Welcome back, " + s.user.name + "! 👋"); nav("/dashboard");
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const demo = [["Farmer", "ramesh@agrochain.com", "farmer123"], ["Buyer", "buyer@agrochain.com", "buyer123"], ["Business", "business@agrochain.com", "business123"], ["Admin", "admin@agrochain.com", "admin123"]];

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="center mb"><div style={{ fontSize: 48 }}>🌾</div><h2>Welcome back</h2><p className="muted">Login to your AgroChain account</p></div>
        {err && <div className="alert alert-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="mb"><label className="f">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div className="mb"><label className="f">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
        </form>
        <p className="center small mt">New to AgroChain? <Link to="/register" className="bold" style={{ color: "var(--green)" }}>Create an account</Link></p>
        <div className="alert alert-info mt small"><b>Demo accounts</b> (click to fill):
          <div className="row mt-s">{demo.map(([l, e, p]) => <button key={l} type="button" className="chip" onClick={() => { setEmail(e); setPassword(p); }}>{l}</button>)}</div></div>
      </div>
    </div>
  );
}

export function Register() {
  const [params] = useSearchParams();
  const { user, login } = useUser();
  const nav = useNavigate();
  const toast = useToast();
  const [role, setRole] = useState(["FARMER", "BUYER", "BUSINESS"].includes(params.get("role")) ? params.get("role") : "BUYER");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", location: "", businessType: "Retailer", farmName: "", farmSize: "", village: "", district: "", state: "Karnataka", experience: "", farmingType: "Organic", mainCrops: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const s = await api.post("/auth/register", { ...f, role });
      login(s);
      toast(role === "FARMER" ? "Registered! Your account is pending admin verification." : "Account created. Welcome to AgroChain! 🌱");
      nav("/dashboard");
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className={"auth-card" + (role === "FARMER" ? " wide" : "")}>
        <div className="center mb"><div style={{ fontSize: 44 }}>🌱</div><h2>Create your account</h2><p className="muted">Join the farm-to-business marketplace</p></div>
        <div className="role-pick">
          {[["FARMER", "🚜", "Farmer"], ["BUYER", "🛒", "Buyer"], ["BUSINESS", "🏢", "Business"]].map(([r, ic, l]) => (
            <button key={r} type="button" className={role === r ? "on" : ""} onClick={() => setRole(r)}><b>{ic}</b>{l}</button>
          ))}
        </div>
        {err && <div className="alert alert-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div><label className="f">{role === "BUSINESS" ? "Business / Company Name" : "Full Name"}</label><input required value={f.name} onChange={set("name")} /></div>
            <div><label className="f">Email</label><input type="email" required value={f.email} onChange={set("email")} /></div>
            <div><label className="f">Phone</label><input required value={f.phone} onChange={set("phone")} /></div>
            <div><label className="f">Password</label><input type="password" required minLength={4} value={f.password} onChange={set("password")} /></div>
            {role === "BUSINESS" && <div><label className="f">Business Type</label><select value={f.businessType} onChange={set("businessType")}>{BUSINESS_TYPES.map((b) => <option key={b}>{b}</option>)}</select></div>}
            {role !== "FARMER" && <div className={role === "BUYER" ? "full" : ""}><label className="f">City / Location</label><input required value={f.location} onChange={set("location")} placeholder="e.g. Bengaluru, Karnataka" /></div>}
            {role === "FARMER" && (<>
              <div><label className="f">Farm Name</label><input required value={f.farmName} onChange={set("farmName")} /></div>
              <div><label className="f">Farm Size (acres)</label><input type="number" min="0" step="0.1" required value={f.farmSize} onChange={set("farmSize")} /></div>
              <div><label className="f">Village</label><input required value={f.village} onChange={set("village")} /></div>
              <div><label className="f">District</label><input required value={f.district} onChange={set("district")} /></div>
              <div><label className="f">State</label><select value={f.state} onChange={set("state")}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="f">Experience (years)</label><input type="number" min="0" value={f.experience} onChange={set("experience")} /></div>
              <div><label className="f">Farming Type</label><select value={f.farmingType} onChange={set("farmingType")}>{FARMING_TYPES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="f">Main Crops</label><input required value={f.mainCrops} onChange={set("mainCrops")} placeholder="Tomato, Onion, Carrot" /></div>
              <div className="full alert alert-warn" style={{ margin: 0 }}>ℹ️ New farmer accounts are reviewed and verified by the AgroChain admin before products can be listed.</div>
            </>)}
          </div>
          <button className="btn btn-primary btn-block mt" disabled={busy}>{busy ? "Creating account..." : "Register"}</button>
        </form>
        <p className="center small mt">Already registered? <Link to="/login" className="bold" style={{ color: "var(--green)" }}>Login</Link></p>
      </div>
    </div>
  );
}
