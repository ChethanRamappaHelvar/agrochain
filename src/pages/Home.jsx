import { useEffect, useState } from "react";
import { Link, useNavigate } from "../router.jsx";
import PriceTicker from "../components/PriceTicker.jsx";
import { api } from "../api.js";
import { useLang, useUser } from "../context/Contexts.jsx";
import { useCategories } from "../hooks/hooks.js";
import { demandBoard, fmtDate, groupAvg, inr, load } from "../utils.js";
import { Loading, ErrorBox, CountUp } from "../components/Common.jsx";
import { emojiFor } from "../data/catalog.js";
import ProductCard from "../components/ProductCard.jsx";
import FarmerCard from "../components/FarmerCard.jsx";
import { WeatherWidget } from "./Weather.jsx";

const WORDS = ["tomatoes", "mangoes", "rice", "turmeric", "jasmine", "bananas"];
const STEPS = [["📝", "Register & Get Verified", "Farmers, buyers and businesses create an account. Farmers are verified by our admin team."], ["🔎", "List or Discover", "Farmers list produce and future harvests. Buyers search, filter and compare sellers."], ["🤝", "Order, Reserve or Contract", "Buy now, reserve crops before harvest, post bulk needs or sign contract farming."], ["🚚", "Track & Receive", "Follow every order on a live timeline, trace the crop lot and rate the farmer."]];
const WHY = [["💸", "Fair prices, no middlemen", "Farmers set their own price and keep more of every sale."], ["🛡️", "Verified farmers", "Every seller is reviewed by admin before listing products."], ["🌱", "Future harvest booking", "Lock supply months ahead at an agreed price."], ["📦", "Bulk & contract farming", "Hotels, retailers and exporters buy tons directly."], ["🔍", "Crop lot traceability", "Know the farm, date and farming type of every batch."], ["🌦️", "Weather & market prices", "Plan harvests with live weather and daily price guides."]];
const TESTI = [["Ramesh Kumar", "Farmer, Anekal", "I sold 500 kg of tomatoes to restaurants in a week, at a better price than the mandi."], ["Priya Nair", "Hotel purchase manager", "Posting a bulk requirement and comparing offers saved us time and about 12% on cost."], ["Anita Sharma", "Home buyer, Bengaluru", "Fresh vegetables from a farmer I can actually trace. The lot ID feature is brilliant."]];

export default function Home() {
  const { t } = useLang();
  const nav = useNavigate();
  const { user } = useUser();
  const cats = useCategories();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const recent = load("agro_recent", []);
  const [prices, setPrices] = useState([]);
  const [wi, setWi] = useState(0);
  const [trend, setTrend] = useState([]);
  useEffect(() => {
    Promise.all([api.get("/order-items"), api.get("/products")]).then(([it, pr]) => {
      const m = {}; it.forEach((i) => { if (i.productId) m[i.productId] = (m[i.productId] || 0) + i.quantity; });
      setTrend(pr.filter((p) => m[p.id]).sort((a, b) => m[b.id] - m[a.id]).slice(0, 4));
    }).catch(() => {});
  }, []);
  useEffect(() => { fetch("/market-prices.json").then((r) => r.json()).then(setPrices).catch(() => {}); }, []);
  useEffect(() => { const id = setInterval(() => setWi((i) => (i + 1) % WORDS.length), 2200); return () => clearInterval(id); }, []);

  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/farmers"), api.get("/harvests"), api.get("/requirements"), api.get("/reviews")])
      .then(([products, farmers, harvests, reqs, reviews]) =>
        setD({ products, farmers: farmers.filter((f) => f.verificationStatus === "Verified"), harvests: harvests.filter((h) => h.status === "Open"), reqs: reqs.filter((r) => r.status === "Open"), reviews }))
      .catch((e) => setErr(e.message));
  }, []);

  const farmerRatings = d ? groupAvg(d.reviews, "farmerId") : {};
  const prodRatings = d ? groupAvg(d.reviews, "productId") : {};
  const demand = d ? demandBoard(d.reqs).slice(0, 6) : [];

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <span className="badge amber" style={{ marginBottom: 14 }}>🌾 Farm-to-Business Agricultural Commerce</span>
            <h1>{t("heroTitle").split(". ")[0]}. <em>{t("heroTitle").split(". ")[1]}</em></h1>
            <p className="lead">{t("heroText")}</p>
            <div className="rotor"><span className="live" />Fresh <b key={wi} className="word">{WORDS[wi]}</b> straight from the farm</div>
            <div className="row">
              <Link to="/products" className="btn btn-amber">🛒 {t("explore")}</Link>
              <Link to={user?.role === "FARMER" ? "/farmer/products" : "/register?role=FARMER"} className="btn btn-light">🚜 {t("sell")}</Link>
            </div>
            <div className="hero-stats">
              <div><b>{d ? <CountUp to={d.farmers.length} suffix="+" /> : "-"}</b><span>Verified Farmers</span></div>
              <div><b>{d ? <CountUp to={d.products.length} suffix="+" /> : "-"}</b><span>Fresh Products</span></div>
              <div><b>{d ? <CountUp to={d.harvests.length} /> : "-"}</b><span>Upcoming Harvests</span></div>
              <div><b>0%</b><span>Commission</span></div>
            </div>
          </div>
          <div className="hero-art"><div>🍅</div><div>🥭</div><div>🌾</div><div>🥕</div><div>🌶️</div><div>🍌</div><div>🧅</div><div>🥥</div><div>🌻</div></div>
        </div>
      </section>

      {prices.length > 0 && <PriceTicker prices={prices} onPick={(n) => nav("/products?q=" + encodeURIComponent(n))} />}
      <div className="container">
        {err && <div className="mt"><ErrorBox message={err} /><div className="alert alert-info">Make sure the Spring Boot backend is running on <b>http://localhost:8080</b> and MySQL is started.</div></div>}
      </div>

      <section className="section">
        <div className="container">
          <div className="sec-head"><div><h2>Shop by Category</h2><p>Everything a farm grows, in one marketplace</p></div><div className="row"><Link to="/seasons" className="btn btn-ghost btn-sm">🗓️ Seasonal guide</Link><Link to="/categories" className="btn btn-outline btn-sm">All categories →</Link></div></div>
          <div className="grid g5">
            {cats.map((c) => <Link key={c.name} to={"/products?category=" + encodeURIComponent(c.name)} className="cat-card"><span className="ic">{c.icon}</span><b>{c.name}</b></Link>)}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="sec-head"><div><h2>Featured Farmers</h2><p>Verified producers you can trust</p></div><Link to="/farmers" className="btn btn-outline btn-sm">View all farmers →</Link></div>
          {!d ? (!err && <Loading />) : <div className="grid g4">{d.farmers.slice(0, 4).map((f) => <FarmerCard key={f.id} farmer={f} rating={farmerRatings[f.id]} />)}</div>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sec-head"><div><h2>Featured Products</h2><p>Fresh from the farm, priced by farmers</p></div><Link to="/products" className="btn btn-outline btn-sm">Browse all products →</Link></div>
          {!d ? (!err && <Loading />) : <div className="grid g4">{d.products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} rating={prodRatings[p.id]} />)}</div>}
          {trend.length > 0 && <div className="mt"><h3 className="mb">🔥 Trending this week</h3><div className="grid g4">{trend.map((p) => <ProductCard key={p.id} product={p} rating={prodRatings[p.id]} />)}</div></div>}
          {recent.length > 0 && (
            <div className="mt"><b>Recently viewed:</b>{" "}
              {recent.map((r) => <Link key={r.id} to={"/products/" + r.id} className="chip" style={{ marginRight: 8 }}>{r.productName}</Link>)}
            </div>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="sec-head"><div><h2>🌱 Upcoming Harvests</h2><p>Reserve crops before they are harvested</p></div><Link to="/harvests" className="btn btn-outline btn-sm">All harvests →</Link></div>
          {d && <div className="grid g3">{d.harvests.slice(0, 3).map((h) => (
            <div key={h.id} className="card hover">
              <span className="badge amber">🌱 Coming Soon</span>
              <h3 className="mt-s">{h.cropName}</h3>
              <div className="muted small">by {h.farmName} • 📍 {h.location}</div>
              <div className="row between mt-s"><b>{h.availableQuantity.toLocaleString("en-IN")} KG</b><span className="price">{inr(h.expectedPrice)}<small>/KG</small></span></div>
              <div className="small muted">Expected harvest: <b>{fmtDate(h.harvestDate)}</b></div>
              <Link to={"/harvests/" + h.id} className="btn btn-primary btn-sm mt">Reserve Harvest</Link>
            </div>
          ))}</div>}
        </div>
      </section>

      <section className="section">
        <div className="container grid g2" style={{ alignItems: "start" }}>
          <div>
            <div className="sec-head"><div><h2>🏢 Businesses Looking for Produce</h2><p>Farmers can respond with their offers</p></div></div>
            <div className="grid">
              {d && d.reqs.slice(0, 3).map((r) => (
                <div key={r.id} className="card hover row between">
                  <div><b>{r.companyName}</b><div className="small muted">Needs <b>{r.quantity.toLocaleString("en-IN")} KG {r.productName}</b> • by {fmtDate(r.requiredDate)}</div></div>
                  <Link to={"/requirements/" + r.id} className="btn btn-outline btn-sm">View Requirement</Link>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="sec-head"><div><h2>📈 Today's Demand</h2><p>Calculated from live requirements</p></div><Link to="/market" className="btn btn-outline btn-sm">Full board →</Link></div>
            <div className="grid">
              {demand.map((x) => (
                <div key={x.name} className="demand"><b>{x.level === "High" ? "🔥 " : ""}{x.name}</b>
                  <span className={"badge " + (x.level === "High" ? "red" : x.level === "Medium" ? "amber" : "grey")}>{x.level} Demand</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sec-head"><div><h2>How AgroChain Works</h2><p>From farm to your doorstep in four simple steps</p></div></div>
          <div className="how" style={{ marginTop: 40 }}>{STEPS.map(([ic, t1, d1], i) => <div className="how-step" key={t1}><div className="n">{i + 1}</div><span className="ic">{ic}</span><h3>{t1}</h3><p className="muted small mt-s">{d1}</p></div>)}</div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="sec-head"><div><h2>Why AgroChain?</h2><p>Built for farmers, loved by buyers</p></div></div>
          <div className="grid g3">{WHY.map(([ic, t1, d1]) => <div className="why" key={t1}><div className="ic">{ic}</div><h3>{t1}</h3><p className="muted small mt-s">{d1}</p></div>)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sec-head"><div><h2>Loved by the Community</h2><p>What farmers and buyers say</p></div></div>
          <div className="grid g3">{TESTI.map(([n, r, q]) => <div className="testi" key={n}><div className="stars">★★★★★</div><p className="mt-s">{q}</p><div className="mt"><b>{n}</b><div className="small muted">{r}</div></div></div>)}</div>
        </div>
      </section>

      <section className="section alt">
        <div className="container grid g2" style={{ alignItems: "center" }}>
          <div><h2>🌦️ Farm Weather</h2><p className="muted mt-s mb">Check live temperature, rain chance and humidity for your farm location before you plan harvest and delivery.</p>
            <Link to="/weather" className="btn btn-primary">Check my location</Link></div>
          <WeatherWidget city="Anekal" />
        </div>
      </section>

      <section className="section">
        <div className="container"><div className="cta">
          <h2>Ready to Grow, Connect and Trade?</h2>
          <p style={{ color: "#cfeaec", marginBottom: 22 }}>Join farmers, buyers and businesses already trading directly on AgroChain.</p>
          <div className="row" style={{ justifyContent: "center" }}>
            <Link to="/register?role=FARMER" className="btn btn-amber">I'm a Farmer</Link>
            <Link to="/register?role=BUYER" className="btn btn-light">I'm a Buyer</Link>
            <Link to="/register?role=BUSINESS" className="btn btn-light">I'm a Business</Link>
          </div>
        </div></div>
      </section>
    </>
  );
}
