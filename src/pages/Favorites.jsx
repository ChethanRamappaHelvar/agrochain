import { useEffect, useState } from "react";
import { Link } from "../router.jsx";
import { api } from "../api.js";
import { useFav } from "../context/Contexts.jsx";
import { groupAvg } from "../utils.js";
import { EmptyState, Loading } from "../components/Common.jsx";
import ProductCard from "../components/ProductCard.jsx";
import FarmerCard from "../components/FarmerCard.jsx";

export default function Favorites() {
  const { fav } = useFav();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState("products");
  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/farmers"), api.get("/reviews")]).then(([products, farmers, reviews]) => setD({ products, farmers, reviews })).catch(() => setD({ products: [], farmers: [], reviews: [] }));
  }, []);
  if (!d) return <Loading />;
  const prods = d.products.filter((p) => fav.products.includes(p.id));
  const farms = d.farmers.filter((f) => fav.farmers.includes(f.id));
  return (
    <div>
      <h2 className="mb">❤️ My Favorites</h2>
      <div className="tabs"><button className={"tab" + (tab === "products" ? " on" : "")} onClick={() => setTab("products")}>Products ({prods.length})</button><button className={"tab" + (tab === "farmers" ? " on" : "")} onClick={() => setTab("farmers")}>Farmers ({farms.length})</button></div>
      {tab === "products" ? (prods.length === 0 ? <EmptyState icon="❤️" title="No favorite products" text="Tap the heart on any product to save it."><Link to="/products" className="btn btn-primary">Browse products</Link></EmptyState> :
        <div className="grid g3">{prods.map((p) => <ProductCard key={p.id} product={p} rating={groupAvg(d.reviews, "productId")[p.id]} />)}</div>)
        : (farms.length === 0 ? <EmptyState icon="🤍" title="No favorite farmers" text="Save farmers you trust to find them quickly."><Link to="/farmers" className="btn btn-primary">Meet farmers</Link></EmptyState> :
        <div className="grid g3">{farms.map((f) => <FarmerCard key={f.id} farmer={f} rating={groupAvg(d.reviews, "farmerId")[f.id]} />)}</div>)}
    </div>
  );
}
