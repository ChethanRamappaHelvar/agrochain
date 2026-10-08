import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "../router.jsx";
import { api } from "../api.js";
import { useCart, useFav, useToast, useUser } from "../context/Contexts.jsx";
import { avg, fmtDate, inr, load, save } from "../utils.js";
import { ErrorBox, Loading, Modal, ProductImage, Rating } from "../components/Common.jsx";

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useUser();
  const { add } = useCart();
  const { isProduct, toggleProduct } = useFav();
  const toast = useToast();
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    setP(null); setErr("");
    api.get("/products/" + id).then((prod) => {
      setP(prod);
      api.get("/farmers/" + prod.farmerId).then(setFarmer).catch(() => {});
      api.get("/reviews?productId=" + prod.id).then(setReviews).catch(() => {});
      // recently viewed (localStorage + JSON)
      const rec = load("agro_recent", []).filter((x) => x.id !== prod.id);
      save("agro_recent", [{ id: prod.id, productName: prod.productName }, ...rec].slice(0, 6));
    }).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="container page"><ErrorBox message={err} /></div>;
  if (!p) return <Loading />;
  const out = !(p.quantity > 0);
  const canBuy = !user || user.role === "BUYER" || user.role === "BUSINESS";
  const addCompare = () => {
    const c = load("agro_compare", []);
    if (!c.includes(p.id)) save("agro_compare", [...c, p.id].slice(-3));
    toast("Added to comparison ⚖️");
  };

  return (
    <div className="container page">
      <div className="small muted mb"><Link to="/products">Products</Link> / {p.category} / <b>{p.productName}</b></div>
      <div className="grid g2" style={{ alignItems: "start" }}>
        <div style={{ position: "relative" }}><ProductImage product={p} size="lg" />{out && <div className="soldout" style={{ height: 340, borderRadius: 16 }}>OUT OF STOCK</div>}</div>
        <div>
          <div className="row"><span className="badge">{p.category}</span>{p.farmingType === "Organic" && <span className="badge">🌿 Organic</span>}{p.quantity > 0 && p.quantity < 50 && <span className="badge amber">⚠ Low Stock - only {p.quantity} {p.unit}</span>}</div>
          <h1 style={{ margin: "10px 0" }}>{p.productName}</h1>
          <Rating value={avg(reviews)} count={reviews.length} />
          <div className="price" style={{ fontSize: 34, margin: "12px 0" }}>{inr(p.price)}<small> / {p.unit}</small></div>
          <p className="muted mb">{p.description || "Fresh farm produce."}</p>
          <dl className="kv mb">
            <dt>Available</dt><dd>{out ? <span className="badge red">Out of Stock</span> : `${p.quantity} ${p.unit}`}</dd>
            <dt>Harvest date</dt><dd>{fmtDate(p.harvestDate)}</dd>
            <dt>Farming type</dt><dd>{p.farmingType}</dd>
            <dt>Location</dt><dd>📍 {p.location}</dd>
            <dt>Farmer</dt><dd><Link to={"/farmers/" + p.farmerId} style={{ color: "var(--green)" }}>{p.farmerName} ({p.farmName})</Link> {farmer?.verificationStatus === "Verified" && <span className="verified">✓ Verified</span>}</dd>
            <dt>Crop Lot ID</dt><dd>{p.lotId ? <Link to={"/trace?lot=" + p.lotId} style={{ color: "var(--green)" }}>{p.lotId} 🔍</Link> : "-"}</dd>
          </dl>
          <div className="row">
            {canBuy && <>
              <input type="number" min="1" max={p.quantity} value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: 110 }} disabled={out} />
              <button className="btn btn-primary" disabled={out} onClick={() => { add(p, Number(qty)); toast("Added to cart 🛒"); }}>🛒 Add to Cart</button>
              <button className="btn btn-amber" disabled={out} onClick={() => { add(p, Number(qty)); nav(user ? "/checkout" : "/login"); }}>⚡ Buy Now</button>
            </>}
            <button className="btn btn-ghost" onClick={() => toggleProduct(p.id)}>{isProduct(p.id) ? "❤️ Saved" : "🤍 Favorite"}</button>
            {user && canBuy && farmer && !out && <button className="btn btn-outline" onClick={() => setOffer({ price: p.price, qty: 1 })}>💬 Make an Offer</button>}
            <button className="btn btn-ghost" onClick={addCompare}>⚖️ Compare</button>
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(window.location.href); toast("Link copied 🔗"); }}>🔗 Share</button>
          </div>
        </div>
      </div>

      <h2 className="mt">Customer Reviews</h2>
      <div className="grid mt-s">
        {reviews.length === 0 && <div className="muted">No reviews yet. Buyers can review after their order is delivered.</div>}
        {reviews.map((r) => (
          <div className="card" key={r.id}><div className="row between"><b>{r.buyerName}</b><span className="muted small">{fmtDate(r.reviewDate)}</span></div><Rating value={r.rating} /><p className="mt-s">{r.comment}</p></div>
        ))}
      </div>
      {offer && (
        <Modal title={"Offer for " + p.productName} onClose={() => setOffer(null)}>
          <p className="muted small mb">Listed at {inr(p.price)}/{p.unit}. Send your price to {p.farmerName}; they will see it in their notifications and can contact you.</p>
          <div className="form-grid">
            <div><label className="f">Your price (₹/{p.unit})</label><input type="number" min="1" value={offer.price} onChange={(e) => setOffer({ ...offer, price: e.target.value })} /></div>
            <div><label className="f">Quantity ({p.unit})</label><input type="number" min="1" value={offer.qty} onChange={(e) => setOffer({ ...offer, qty: e.target.value })} /></div>
          </div>
          <button className="btn btn-primary btn-block mt" onClick={async () => {
            try {
              await api.post("/notifications", { userId: farmer.userId, type: "Order", message: `${user.name} offers ₹${offer.price}/${p.unit} for ${offer.qty} ${p.unit} of ${p.productName} (listed ₹${p.price}). Contact: ${user.phone || user.email}` });
              toast("Offer sent to the farmer ✓"); setOffer(null);
            } catch (e) { toast(e.message, "error"); }
          }}>Send Offer</button>
        </Modal>)}
    </div>
  );
}
