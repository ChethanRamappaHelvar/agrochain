import { useState } from "react";
import { Link } from "../router.jsx";
import { useToast } from "../context/Contexts.jsx";
import { PageHeader } from "../components/Common.jsx";

export function About() {
  const feats = [["🛒", "Direct Farmer Marketplace", "Farmers sell straight to consumers - no middlemen."], ["🏢", "Farmer-to-Business", "Hotels, restaurants, retailers, wholesalers and exporters buy in bulk."],
    ["🌱", "Future Harvest Booking", "Reserve crops before they are harvested."], ["📝", "Bulk Requirements", "Businesses post demand, farmers send offers."],
    ["📃", "Contract Farming", "Companies publish future crop contracts."], ["🔍", "Crop Lot Tracking", "Trace any product back to its farm."],
    ["✅", "Farmer Verification", "Admin-verified farmers build trust."], ["📈", "Prices & Demand", "Market price comparison and a live demand board."],
    ["🌦️", "Weather", "Live weather for your farm location."]];
  return (
    <>
      <PageHeader title="About AgroChain" subtitle="Grow. Connect. Trade." />
      <div className="container page">
        <div className="card mb"><h2>Our Mission</h2><p className="muted mt-s">To build a digital agricultural commerce ecosystem where farmers can sell current and future produce directly to consumers and businesses while managing products, inventory, orders and market opportunities through a single platform.</p></div>
        <div className="grid g3">{feats.map(([i, t, d]) => <div className="card hover" key={t}><div style={{ fontSize: 36 }}>{i}</div><h3 className="mt-s">{t}</h3><p className="muted small">{d}</p></div>)}</div>
        <div className="card mt"><h3>Technology</h3><p className="muted mt-s">React.js (Context API, hooks, Fetch API) • Java Spring Boot REST CRUD • MySQL • HTML5 & CSS3.</p></div>
        <div className="card mt" id="privacy"><h3>Privacy & Terms</h3><p className="muted mt-s">AgroChain is an academic demonstration project. Passwords are stored hashed, and personal data is only used inside the platform for orders and notifications.</p></div>
        <h2 className="mt mb">Frequently asked questions</h2>
        {[["How do farmers get verified?", "Register as a farmer; the admin reviews your farm details and verifies your account. Verified farmers get a green badge and can list products, harvests and respond to requirements."],
          ["What is Future Harvest booking?", "Farmers list crops that are still growing. Buyers reserve part of the expected harvest in advance, which gives farmers assured demand and buyers assured supply."],
          ["How do bulk requirements work?", "Businesses post what they need and the maximum price. Farmers send offers, the business compares them and selects the best farmer, which creates an order."],
          ["Can I trace where my produce came from?", "Yes. Every product has a Crop Lot ID. Enter it on the Trace page to see the farmer, farm, location and harvest date."]]
          .map(([q, a]) => <details className="faq" key={q}><summary>{q}</summary><p>{a}</p></details>)}
        <div className="center mt"><Link to="/register" className="btn btn-primary">Join AgroChain</Link></div>
      </div>
    </>
  );
}

export function Contact() {
  const toast = useToast();
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const submit = (e) => { e.preventDefault(); toast("Thanks! We'll get back to you soon. ✉️"); setF({ name: "", email: "", message: "" }); };
  return (
    <>
      <PageHeader title="Contact Us" subtitle="We'd love to hear from you" />
      <div className="container page"><div className="grid g2" style={{ alignItems: "start" }}>
        <div className="card"><h3>Get in touch</h3><dl className="kv mt"><dt>📍 Address</dt><dd>AgroChain HQ, Bengaluru, Karnataka</dd><dt>📞 Phone</dt><dd>+91 98765 00000</dd><dt>✉️ Email</dt><dd>support@agrochain.com</dd><dt>🕘 Hours</dt><dd>Mon–Sat, 9am – 6pm</dd></dl></div>
        <form className="card" onSubmit={submit}>
          <div className="mb"><label className="f">Name</label><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="mb"><label className="f">Email</label><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="mb"><label className="f">Message</label><textarea required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
          <button className="btn btn-primary">Send message</button>
        </form></div></div>
    </>
  );
}

export const NotFound = () => (
  <div className="container page center"><div style={{ fontSize: 80 }}>🌾</div><h1>404 - Page not found</h1><p className="muted mb">This field is empty. Let's go back to the market.</p><Link to="/" className="btn btn-primary">Back to Home</Link></div>
);
