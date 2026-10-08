import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useUser } from "../context/Contexts.jsx";
import { demandBoard, inr } from "../utils.js";
import { Loading, PageHeader } from "../components/Common.jsx";

export default function Market() {
  const { user, farmer } = useUser();
  const [tab, setTab] = useState("demand");
  const [reqs, setReqs] = useState(null);
  const [prices, setPrices] = useState([]);
  const [mine, setMine] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/requirements").then(setReqs).catch(() => setReqs([]));
    fetch("/market-prices.json").then((r) => r.json()).then(setPrices).catch(() => {});
    if (farmer) api.get("/products?farmerId=" + farmer.id).then(setMine).catch(() => {});
  }, [farmer]);
  if (!reqs) return <Loading />;
  const board = demandBoard(reqs);
  const shown = prices.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));
  const marketOf = (name) => prices.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const arrow = { up: "▲", down: "▼", flat: "▬" };

  return (
    <>
      <PageHeader title="📈 Market Demand & Prices" subtitle="Know what is in demand and what the market pays today" />
      <div className="container page">
        <div className="tabs">
          <button className={"tab" + (tab === "demand" ? " on" : "")} onClick={() => setTab("demand")}>🔥 Demand Board</button>
          <button className={"tab" + (tab === "prices" ? " on" : "")} onClick={() => setTab("prices")}>💹 Today's Market Prices</button>
          {user?.role === "FARMER" && <button className={"tab" + (tab === "mine" ? " on" : "")} onClick={() => setTab("mine")}>⚖️ My Price vs Market</button>}
        </div>

        {tab === "demand" && (<>
          <div className="alert alert-info">Demand is calculated from the number and size of open bulk requirements posted by businesses.</div>
          <div className="grid g3">{board.map((x) => (
            <div key={x.name} className="card hover">
              <div className="row between"><h3>{x.level === "High" ? "🔥 " : ""}{x.name}</h3><span className={"badge " + (x.level === "High" ? "red" : x.level === "Medium" ? "amber" : "grey")}>{x.level} Demand</span></div>
              <div className="muted small mt-s">{x.count} open requirement(s) • {x.qty.toLocaleString("en-IN")} KG needed</div>
              <div className="bar mt-s"><i style={{ width: Math.min(100, x.count * 40 + (x.qty / 200)) + "%" }} /></div>
            </div>))}</div>
        </>)}

        {tab === "prices" && (<>
          <div className="alert alert-info">Reference prices (sample dataset for the project). Updated daily in a real deployment.</div>
          <input placeholder="🔍 Search crop or category" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 380, borderRadius: 999 }} className="mb" />
          <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Market Price</th><th>Trend</th></tr></thead>
            <tbody>{shown.map((p) => <tr key={p.name}><td><b>{p.name}</b></td><td>{p.category}</td><td><b>{inr(p.price)}</b>/{p.unit}</td><td className={"trend-" + p.trend}>{arrow[p.trend]} {p.trend}</td></tr>)}</tbody></table></div>
        </>)}

        {tab === "mine" && (
          mine.length === 0 ? <div className="alert alert-warn">Add products to compare your prices with the market.</div> :
          <div className="table-wrap"><table><thead><tr><th>Product</th><th>My Selling Price</th><th>Market Price</th><th>Difference</th></tr></thead>
            <tbody>{mine.map((p) => { const m = marketOf(p.productName); const diff = m ? m.price - p.price : null;
              return <tr key={p.id}><td><b>{p.productName}</b></td><td>{inr(p.price)}/{p.unit}</td><td>{m ? inr(m.price) : "n/a"}</td>
                <td>{diff === null ? "-" : <b style={{ color: diff >= 0 ? "var(--red)" : "var(--green)" }}>{diff >= 0 ? `${inr(diff)} below market - you can raise` : `${inr(-diff)} above market`}</b>}</td></tr>; })}</tbody></table></div>)}
      </div>
    </>
  );
}
