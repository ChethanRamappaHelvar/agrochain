import { useEffect, useState } from "react";
import { Link, useSearchParams } from "../router.jsx";
import { api } from "../api.js";
import { fmtDate } from "../utils.js";
import { PageHeader } from "../components/Common.jsx";

export default function Trace() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("lot") || "");
  const [lot, setLot] = useState(null);
  const [err, setErr] = useState("");
  const search = async (c = code) => {
    setErr(""); setLot(null);
    try {
      const r = await api.get("/crop-lots?lotCode=" + encodeURIComponent(c.trim().toUpperCase()));
      r.length ? setLot(r[0]) : setErr("No crop lot found with ID " + c.toUpperCase());
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { if (params.get("lot")) search(params.get("lot")); }, []); // eslint-disable-line
  return (
    <>
      <PageHeader title="🔍 Crop Lot Traceability" subtitle="Know exactly where your produce came from" />
      <div className="container page" style={{ maxWidth: 680 }}>
        <form className="row mb" onSubmit={(e) => { e.preventDefault(); search(); }}>
          <input style={{ flex: 1, borderRadius: 999 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter Lot ID e.g. LOT-TOM-1001" />
          <button className="btn btn-primary">Trace</button>
        </form>
        {err && <div className="alert alert-err">{err}</div>}
        {lot && (
          <div className="card">
            <span className="badge">✓ Lot found</span><h2 className="mt-s">{lot.lotCode}</h2>
            <dl className="kv mt">
              <dt>Crop</dt><dd><b>{lot.cropName}</b></dd><dt>Farmer</dt><dd><Link to={"/farmers/" + lot.farmerId} style={{ color: "var(--green)" }}>{lot.farmerName}</Link></dd>
              <dt>Farm</dt><dd>{lot.farmName}</dd><dt>Location</dt><dd>📍 {lot.location}</dd><dt>Harvest date</dt><dd>{fmtDate(lot.harvestDate)}</dd>
              <dt>Farming type</dt><dd>{lot.farmingType}</dd><dt>Quantity</dt><dd>{lot.quantity} KG (at listing)</dd>
            </dl>
            <Link to={"/products/" + lot.productId} className="btn btn-outline btn-sm mt">View product</Link>
          </div>)}
      </div>
    </>
  );
}
