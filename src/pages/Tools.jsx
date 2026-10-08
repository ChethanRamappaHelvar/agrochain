import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "../router.jsx";
import { api } from "../api.js";
import { useToast, useUser } from "../context/Contexts.jsx";
import { useCategories } from "../hooks/hooks.js";
import { MONTHS, SEASONS } from "../data/seasons.js";
import { emojiFor, catGradient } from "../data/catalog.js";
import { inr, load, save } from "../utils.js";
import { EmptyState, PageHeader, StatCard } from "../components/Common.jsx";

// ------------------------------------------------------------ Farmer: crop profit calculator
export function ProfitCalculator() {
  const toast = useToast();
  const cats = useCategories();
  const crops = useMemo(() => cats.flatMap((c) => c.items), [cats]);
  const [f, setF] = useState({ crop: "Tomato", acres: 1, yieldPerAcre: 8000, costPerAcre: 45000, price: 30 });
  const [plans, setPlans] = useState(() => load("agro_plans", []));
  const [prices, setPrices] = useState([]);
  useEffect(() => { fetch("/market-prices.json").then((r) => r.json()).then(setPrices).catch(() => {}); }, []);
  useEffect(() => save("agro_plans", plans), [plans]);

  const n = (k) => Number(f[k]) || 0;
  const totalYield = n("acres") * n("yieldPerAcre");
  const revenue = totalYield * n("price");
  const cost = n("acres") * n("costPerAcre");
  const profit = revenue - cost;
  const margin = revenue ? (profit / revenue) * 100 : 0;
  const breakEven = totalYield ? cost / totalYield : 0;
  const market = prices.find((p) => p.name.toLowerCase() === f.crop.toLowerCase());
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const savePlan = () => { setPlans([{ id: Date.now(), ...f, revenue, cost, profit }, ...plans].slice(0, 8)); toast("Plan saved ✓"); };

  return (
    <div>
      <h2 className="mb">🧮 Crop Profit Calculator</h2>
      <div className="grid g2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 className="mb">Your plan</h3>
          <div className="form-grid">
            <div className="full"><label className="f">Crop</label><input list="calc-crops" value={f.crop} onChange={set("crop")} /><datalist id="calc-crops">{crops.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div><label className="f">Land (acres)</label><input type="number" min="0" step="0.1" value={f.acres} onChange={set("acres")} /></div>
            <div><label className="f">Yield per acre (KG)</label><input type="number" min="0" value={f.yieldPerAcre} onChange={set("yieldPerAcre")} /></div>
            <div><label className="f">Cost per acre (₹)</label><input type="number" min="0" value={f.costPerAcre} onChange={set("costPerAcre")} /></div>
            <div><label className="f">Selling price (₹/KG)</label><input type="number" min="0" step="0.5" value={f.price} onChange={set("price")} /></div>
          </div>
          {market && <div className="alert alert-info mt small">Market reference for {market.name}: <b>{inr(market.price)}/{market.unit}</b>. {n("price") < market.price ? "You are pricing below market, you could earn more." : "You are pricing above market, check buyer demand."}</div>}
          <button className="btn btn-primary mt" onClick={savePlan}>💾 Save this plan</button>
        </div>
        <div>
          <div className="grid g2">
            <StatCard icon="🌾" label="Total yield (KG)" value={totalYield} />
            <StatCard icon="💵" label="Revenue" value={inr(revenue)} />
            <StatCard icon="🧾" label="Total cost" value={inr(cost)} />
            <StatCard icon={profit >= 0 ? "📈" : "📉"} label="Profit / loss" value={inr(profit)} />
          </div>
          <div className="card mt">
            <div className="row between"><b>Profit margin</b><b style={{ color: margin >= 0 ? "#34d399" : "#fb7185" }}>{margin.toFixed(1)}%</b></div>
            <div className="bar mt-s"><i style={{ width: Math.max(0, Math.min(100, margin)) + "%" }} /></div>
            <div className="small muted mt-s">Break-even price: <b>{inr(breakEven)}/KG</b></div>
          </div>
        </div>
      </div>
      <h3 className="mt mb">Saved plans</h3>
      {plans.length === 0 ? <div className="muted">No saved plans yet.</div> : (
        <div className="table-wrap"><table><thead><tr><th>Crop</th><th>Acres</th><th>Revenue</th><th>Cost</th><th>Profit</th><th></th></tr></thead>
          <tbody>{plans.map((p) => <tr key={p.id}><td><b>{emojiFor(p.crop)} {p.crop}</b></td><td>{p.acres}</td><td>{inr(p.revenue)}</td><td>{inr(p.cost)}</td><td><b style={{ color: p.profit >= 0 ? "#34d399" : "#fb7185" }}>{inr(p.profit)}</b></td>
            <td><div className="row"><button className="btn btn-ghost btn-sm" onClick={() => setF({ crop: p.crop, acres: p.acres, yieldPerAcre: p.yieldPerAcre, costPerAcre: p.costPerAcre, price: p.price })}>Load</button><button className="btn btn-danger btn-sm" onClick={() => setPlans(plans.filter((x) => x.id !== p.id))}>Delete</button></div></td></tr>)}</tbody></table></div>)}
    </div>
  );
}

// ------------------------------------------------------------ Buyer: shopping list (localStorage)
export function ShoppingList() {
  const [items, setItems] = useState(() => load("agro_list", []));
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const inputRef = useRef();
  useEffect(() => save("agro_list", items), [items]);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const add = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setItems([{ id: Date.now(), name: name.trim(), qty: Number(qty) || 1, done: false }, ...items]);
    setName(""); setQty(1); inputRef.current.focus();
  };
  const toggle = (id) => setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const done = items.filter((i) => i.done).length;
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      <h2 className="mb">📝 My Shopping List</h2>
      <div className="grid g3 mb"><StatCard icon="🛒" label="Items" value={items.length} /><StatCard icon="✅" label="Picked" value={done} /><StatCard icon="⚖️" label="Total quantity" value={totalQty} /></div>
      <form className="card row" onSubmit={add}>
        <input ref={inputRef} style={{ flex: 1, minWidth: 180 }} placeholder="Add item e.g. Tomato" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" min="1" style={{ width: 100 }} value={qty} onChange={(e) => setQty(e.target.value)} />
        <button className="btn btn-primary">+ Add</button>
      </form>
      <div className="grid mt">
        {items.length === 0 && <EmptyState icon="📝" title="Your list is empty" text="Plan what you need, then find it in the market." />}
        {items.map((i) => (
          <div className="card row between" key={i.id} style={{ opacity: i.done ? 0.55 : 1 }}>
            <label className="row" style={{ cursor: "pointer", flex: 1 }}>
              <input type="checkbox" style={{ width: 20 }} checked={i.done} onChange={() => toggle(i.id)} />
              <span style={{ textDecoration: i.done ? "line-through" : "none" }}>{emojiFor(i.name)} <b>{i.name}</b> × {i.qty}</span>
            </label>
            <div className="row"><Link className="btn btn-outline btn-sm" to={"/products?q=" + encodeURIComponent(i.name)}>Find in market</Link><button className="icon-btn" onClick={() => setItems(items.filter((x) => x.id !== i.id))}>🗑</button></div>
          </div>
        ))}
      </div>
      {done > 0 && <button className="btn btn-ghost mt" onClick={() => setItems(items.filter((i) => !i.done))}>Clear picked items</button>}
    </div>
  );
}

// ------------------------------------------------------------ Public: seasonal guide
export function Seasons() {
  const now = new Date().getMonth() + 1;
  const [month, setMonth] = useState(now);
  const [products, setProducts] = useState([]);
  useEffect(() => { api.get("/products").then(setProducts).catch(() => {}); }, []);
  const crops = SEASONS[month];
  const next = SEASONS[(month % 12) + 1].filter((c) => !crops.includes(c));
  const listed = (crop) => products.filter((p) => p.productName.toLowerCase().includes(crop.toLowerCase()) && p.quantity > 0).length;

  return (
    <>
      <PageHeader title="🗓️ Seasonal Crop Guide" subtitle="What is fresh, and what to plan for next month" />
      <div className="container page">
        <div className="cat-chips">{MONTHS.map((m, i) => <button key={m} className={month === i + 1 ? "on" : ""} onClick={() => setMonth(i + 1)}>{m.slice(0, 3)}{i + 1 === now ? " •" : ""}</button>)}</div>
        <h2 className="mb">In season in {MONTHS[month - 1]}</h2>
        <div className="grid g4">
          {crops.map((c) => (
            <Link key={c} to={"/products?q=" + encodeURIComponent(c)} className="card hover center">
              <div className="pimg tile md" style={{ background: catGradient("Vegetables"), borderRadius: 14, height: 110 }}><span style={{ fontSize: 56 }}>{emojiFor(c)}</span></div>
              <h3 className="mt-s">{c}</h3>
              <div className="small muted">{listed(c) ? <span className="badge">{listed(c)} listing(s) available</span> : "No listings right now"}</div>
            </Link>
          ))}
        </div>
        {next.length > 0 && <div className="card mt"><h3>🌱 Coming next month: {MONTHS[month % 12]}</h3><div className="row mt-s">{next.map((c) => <Link key={c} className="chip" to={"/products?q=" + encodeURIComponent(c)}>{emojiFor(c)} {c}</Link>)}</div></div>}
        <div className="alert alert-info mt small">Guide based on typical South Indian growing seasons. Actual harvest depends on weather and region.</div>
      </div>
    </>
  );
}
