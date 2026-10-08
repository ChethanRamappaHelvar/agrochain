import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "../router.jsx";
import { api } from "../api.js";
import { useFav } from "../context/Contexts.jsx";
import { avg, fmtDate, groupAvg } from "../utils.js";
import { EmptyState, ErrorBox, Loading, PageHeader, Rating, initials } from "../components/Common.jsx";
import FarmerCard from "../components/FarmerCard.jsx";
import ProductCard from "../components/ProductCard.jsx";

export function Farmers() {
  const [farmers, setFarmers] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("rating");
  const [err, setErr] = useState("");
  useEffect(() => {
    Promise.all([api.get("/farmers"), api.get("/reviews")]).then(([f, r]) => { setFarmers(f.filter((x) => x.verificationStatus === "Verified")); setReviews(r); }).catch((e) => setErr(e.message));
  }, []);
  const ratings = useMemo(() => groupAvg(reviews, "farmerId"), [reviews]);
  const list = (farmers || []).filter((f) => [f.name, f.farmName, f.location, f.mainCrops].some((x) => (x || "").toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === "experience" ? b.experience - a.experience : sort === "size" ? b.farmSize - a.farmSize : sort === "name" ? a.name.localeCompare(b.name) : (ratings[b.id]?.avg || 0) - (ratings[a.id]?.avg || 0));

  return (
    <>
      <PageHeader title="👨‍🌾 Our Farmers" subtitle="Meet the verified producers behind your food" />
      <div className="container page">
        <ErrorBox message={err} />
        <div className="row mb"><input placeholder="🔍 Search by name, farm, location or crop" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 480, borderRadius: 999, flex: 1 }} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 220 }}><option value="rating">Top rated</option><option value="experience">Most experienced</option><option value="size">Largest farm</option><option value="name">Name A–Z</option></select></div>
        {!farmers ? !err && <Loading /> : list.length === 0 ? <EmptyState icon="👨‍🌾" title="No farmers found" /> : <div className="grid g4">{list.map((f) => <FarmerCard key={f.id} farmer={f} rating={ratings[f.id]} />)}</div>}
      </div>
    </>
  );
}

export function FarmerProfile() {
  const { id } = useParams();
  const { isFarmer, toggleFarmer } = useFav();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    Promise.all([api.get("/farmers/" + id), api.get("/products?farmerId=" + id), api.get("/reviews?farmerId=" + id)])
      .then(([farmer, products, reviews]) => setD({ farmer, products, reviews })).catch((e) => setErr(e.message));
  }, [id]);
  if (err) return <div className="container page"><ErrorBox message={err} /></div>;
  if (!d) return <Loading />;
  const { farmer: f, products, reviews } = d;
  const prodRatings = groupAvg(reviews, "productId");

  return (
    <div className="container page">
      <div className="card row" style={{ gap: 26, alignItems: "flex-start" }}>
        <div className="fimg" style={{ width: 120, height: 120, fontSize: 48, margin: 0 }}>{initials(f.name)}</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="row between"><h1>{f.name}</h1><button className="btn btn-ghost" onClick={() => toggleFarmer(f.id)}>{isFarmer(f.id) ? "❤️ Saved farmer" : "🤍 Save farmer"}</button></div>
          <div className="bold" style={{ color: "var(--green)", fontSize: 18 }}>{f.farmName}</div>
          <div className="row mt-s">{f.verificationStatus === "Verified" ? <span className="verified">✓ Verified Farmer</span> : <span className="badge amber">{f.verificationStatus}</span>}<Rating value={avg(reviews)} count={reviews.length} /></div>
          <p className="muted mt-s">{f.about}</p>
          <div className="row mt-s"><a className="btn btn-primary btn-sm" href={"tel:" + f.phone}>📞 Call farmer</a><a className="btn btn-outline btn-sm" target="_blank" rel="noreferrer" href={"https://wa.me/91" + (f.phone || "").replace(/\D/g, "").slice(-10)}>💬 WhatsApp</a></div>
          <dl className="kv mt">
            <dt>Location</dt><dd>📍 {f.village}, {f.district}, {f.state}</dd><dt>Farm size</dt><dd>{f.farmSize} acres</dd><dt>Farming type</dt><dd>{f.farmingType}</dd>
            <dt>Experience</dt><dd>{f.experience} years</dd><dt>Main crops</dt><dd>🌱 {f.mainCrops}</dd>
          </dl>
        </div>
      </div>
      <h2 className="mt mb">Products by {f.farmName}</h2>
      {products.length === 0 ? <EmptyState icon="🧺" title="No products listed yet" /> : <div className="grid g4">{products.map((p) => <ProductCard key={p.id} product={p} rating={prodRatings[p.id]} />)}</div>}
      <h2 className="mt mb">Reviews</h2>
      <div className="grid g2">
        {reviews.length === 0 && <div className="muted">No reviews yet.</div>}
        {reviews.map((r) => <div className="card" key={r.id}><div className="row between"><b>{r.buyerName}</b><span className="small muted">{fmtDate(r.reviewDate)}</span></div><div className="small muted">on {r.productName}</div><Rating value={r.rating} /><p className="mt-s">{r.comment}</p></div>)}
      </div>
    </div>
  );
}
