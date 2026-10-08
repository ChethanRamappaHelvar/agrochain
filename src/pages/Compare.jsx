import { useEffect, useState } from "react";
import { Link } from "../router.jsx";
import { api } from "../api.js";
import { useCart, useToast } from "../context/Contexts.jsx";
import { avg, fmtDate, inr, load, save } from "../utils.js";
import { EmptyState, Loading, PageHeader, ProductImage, Rating } from "../components/Common.jsx";

export default function Compare() {
  const [ids, setIds] = useState(() => load("agro_compare", []));
  const [data, setData] = useState(null);
  const { add } = useCart();
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/reviews")]).then(([p, r]) =>
      setData({ products: p, reviews: r })).catch(() => setData({ products: [], reviews: [] }));
  }, []);
  if (!data) return <Loading />;
  const list = data.products.filter((p) => ids.includes(p.id));
  const remove = (id) => { const n = ids.filter((x) => x !== id); setIds(n); save("agro_compare", n); };
  const best = list.length ? Math.min(...list.map((p) => p.price)) : 0;

  const rows = [
    ["Farmer", (p) => p.farmerName], ["Farm", (p) => p.farmName], ["Location", (p) => "📍 " + p.location],
    ["Price", (p) => <b style={{ color: p.price === best ? "var(--green)" : "inherit" }}>{inr(p.price)}/{p.unit} {p.price === best && list.length > 1 && "✓ Best"}</b>],
    ["Rating", (p) => <Rating value={avg(data.reviews.filter((r) => r.productId === p.id))} />],
    ["Available", (p) => (p.quantity > 0 ? p.quantity + " " + p.unit : <span className="badge red">Out of stock</span>)],
    ["Farming type", (p) => p.farmingType], ["Harvest date", (p) => fmtDate(p.harvestDate)],
  ];

  return (
    <>
      <PageHeader title="⚖️ Compare Products" subtitle="Pick the best seller for your need" />
      <div className="container page">
        {list.length === 0 ? <EmptyState icon="⚖️" title="Nothing to compare" text="Tick 'Compare' on up to 3 products in the marketplace."><Link to="/products" className="btn btn-primary">Browse products</Link></EmptyState> : (
          <div className="table-wrap"><table>
            <thead><tr><th></th>{list.map((p) => <th key={p.id}><div className="row"><ProductImage product={p} size="sm" /><div>{p.productName}<br /><button className="btn btn-ghost btn-sm" onClick={() => remove(p.id)}>Remove</button></div></div></th>)}</tr></thead>
            <tbody>
              {rows.map(([label, fn]) => <tr key={label}><td className="bold">{label}</td>{list.map((p) => <td key={p.id}>{fn(p)}</td>)}</tr>)}
              <tr><td></td>{list.map((p) => <td key={p.id}><button className="btn btn-primary btn-sm" disabled={!(p.quantity > 0)} onClick={() => { add(p, 1); toast("Added to cart 🛒"); }}>Add to Cart</button></td>)}</tr>
            </tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
