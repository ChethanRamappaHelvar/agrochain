import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "../router.jsx";
import { api } from "../api.js";
import { useCategories } from "../hooks/hooks.js";
import { groupAvg, load, save } from "../utils.js";
import { EmptyState, ErrorBox, PageHeader, SkeletonGrid } from "../components/Common.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { FARMING_TYPES } from "../data/catalog.js";

const SORTS = {
  newest: (a, b) => b.id - a.id,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  rating: (a, b) => b._r - a._r,
  quantity: (a, b) => b.quantity - a.quantity,
  farmer: (a, b) => (a.farmerName || "").localeCompare(b.farmerName || ""),
};

export default function Products() {
  const [params] = useSearchParams();
  const cats = useCategories();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [location, setLocation] = useState("");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [farmer, setFarmer] = useState("");
  const [avail, setAvail] = useState("");
  const [ftype, setFtype] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [history, setHistory] = useState(() => load("agro_searches", []));
  const [compare, setCompare] = useState(() => load("agro_compare", []));
  const searchRef = useRef();
  const recent = load("agro_recent", []);

  useEffect(() => {
    searchRef.current && searchRef.current.focus();
    Promise.all([api.get("/products"), api.get("/reviews")])
      .then(([p, r]) => { setProducts(p); setReviews(r); })
      .catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { setCategory(params.get("category") || ""); setSearch(params.get("q") || ""); }, [params]);

  const ratings = useMemo(() => groupAvg(reviews, "productId"), [reviews]);
  const farmNames = useMemo(() => [...new Set(products.map((p) => p.farmName).filter(Boolean))], [products]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .map((p) => ({ ...p, _r: ratings[p.id]?.avg || 0 }))
      .filter((p) => !q || [p.productName, p.category, p.farmName, p.farmerName, p.location].some((x) => (x || "").toLowerCase().includes(q)))
      .filter((p) => !category || p.category === category)
      .filter((p) => !location || (p.location || "").toLowerCase().includes(location.toLowerCase()))
      .filter((p) => minP === "" || p.price >= Number(minP))
      .filter((p) => maxP === "" || p.price <= Number(maxP))
      .filter((p) => !farmer || p.farmName === farmer)
      .filter((p) => !avail || (avail === "in" ? p.quantity > 0 : p.quantity <= 0))
      .filter((p) => !ftype || p.farmingType === ftype)
      .filter((p) => minRating === "" || p._r >= Number(minRating))
      .sort(SORTS[sort]);
  }, [products, ratings, search, category, location, minP, maxP, farmer, avail, ftype, minRating, sort]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const h = [q, ...history.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    setHistory(h); save("agro_searches", h);
  };
  const toggleCompare = (id) => {
    const c = compare.includes(id) ? compare.filter((x) => x !== id) : compare.length < 3 ? [...compare, id] : compare;
    setCompare(c); save("agro_compare", c);
  };
  const reset = () => { setSearch(""); setCategory(""); setLocation(""); setMinP(""); setMaxP(""); setFarmer(""); setAvail(""); setFtype(""); setMinRating(""); setSort("newest"); };

  return (
    <>
      <PageHeader title="🛒 Marketplace" subtitle="Fresh produce directly from verified farmers" />
      <div className="container page">
        <ErrorBox message={err} />
        {(search || category || location || minP || maxP || farmer || avail || ftype || minRating) && <button className="btn btn-ghost float-reset" onClick={reset}>✕ Reset filters</button>}
        <form onSubmit={submitSearch} className="row">
          <input ref={searchRef} style={{ flex: 1, minWidth: 220, padding: "13px 18px", borderRadius: 999 }} placeholder="🔍 Search tomato, organic rice, mango, farm or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-primary">Search</button>
        </form>
        {history.length > 0 && (
          <div className="row mt-s small"><span className="muted">Recent searches:</span>
            {history.map((h) => <button key={h} className="chip" onClick={() => setSearch(h)}>{h}</button>)}
            <button className="chip" onClick={() => { setHistory([]); save("agro_searches", []); }}>Clear</button></div>
        )}

        <div className="cat-chips">
          <button className={category === "" ? "on" : ""} onClick={() => setCategory("")}>✨ All</button>
          {cats.map((c) => <button key={c.name} className={category === c.name ? "on" : ""} onClick={() => setCategory(c.name)}>{c.icon} {c.name}</button>)}
        </div>
        <div className="filter-bar" style={{ marginTop: 6 }}>
          <div className="filter-grid">
            <div><label className="f">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c.name}>{c.name}</option>)}</select></div>
            <div><label className="f">Location</label><input placeholder="e.g. Karnataka" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
            <div><label className="f">Min price (₹)</label><input type="number" min="0" value={minP} onChange={(e) => setMinP(e.target.value)} /></div>
            <div><label className="f">Max price (₹)</label><input type="number" min="0" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></div>
            <div><label className="f">Farmer / Farm</label><select value={farmer} onChange={(e) => setFarmer(e.target.value)}><option value="">All farms</option>{farmNames.map((n) => <option key={n}>{n}</option>)}</select></div>
            <div><label className="f">Availability</label><select value={avail} onChange={(e) => setAvail(e.target.value)}><option value="">All</option><option value="in">In stock</option><option value="out">Out of stock</option></select></div>
            <div><label className="f">Farming type</label><select value={ftype} onChange={(e) => setFtype(e.target.value)}><option value="">All</option>{FARMING_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="f">Min rating</label><select value={minRating} onChange={(e) => setMinRating(e.target.value)}><option value="">Any</option><option value="3">3★ & up</option><option value="4">4★ & up</option><option value="4.5">4.5★ & up</option></select></div>
            <div><label className="f">Sort by</label><select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option><option value="priceAsc">Price: Low to High</option><option value="priceDesc">Price: High to Low</option>
              <option value="rating">Rating</option><option value="quantity">Quantity</option><option value="farmer">Farmer Name</option></select></div>
          </div>
          <div className="row between mt"><span className="muted small">{list.length} product(s) found</span><button className="btn btn-ghost btn-sm" onClick={reset}>Reset filters</button></div>
        </div>

        {compare.length > 0 && (
          <div className="alert alert-info row between">
            <span>⚖️ {compare.length} product(s) selected for comparison (max 3)</span>
            <span className="row"><Link to="/compare" className="btn btn-primary btn-sm">Compare now</Link><button className="btn btn-ghost btn-sm" onClick={() => { setCompare([]); save("agro_compare", []); }}>Clear</button></span>
          </div>
        )}

        <div className="row between" style={{ margin: "6px 0 18px" }}>
          <div><h2>Today's Market</h2><p className="muted small"><span className="live" />{list.length} listings matching your filters</p></div>
          <div className="seg"><button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>▦ Grid</button><button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>☰ List</button></div>
        </div>
        {loading ? <SkeletonGrid /> : list.length === 0 ? (
          <EmptyState icon="🔎" title="No products found" text="Try changing your search or filters."><button className="btn btn-primary" onClick={reset}>Reset filters</button></EmptyState>
        ) : (
          <div className={"grid " + (view === "list" ? "listview" : "g4")}>{list.map((p) => <ProductCard key={p.id} product={p} rating={ratings[p.id]} onCompare={toggleCompare} compared={compare.includes(p.id)} />)}</div>
        )}

        {recent.length > 0 && (
          <div className="mt"><h3 className="mb">🕘 Recently viewed</h3>
            <div className="row">{recent.map((r) => <Link key={r.id} to={"/products/" + r.id} className="chip">{r.productName}</Link>)}</div></div>
        )}
      </div>
    </>
  );
}
