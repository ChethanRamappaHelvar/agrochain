export const inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
export const fmtDate = (d) =>
  d
    ? new Date(
        d.length === 10 ? d + "T00:00:00" : d.replace(" ", "T"),
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";
export const avg = (arr) =>
  arr.length ? arr.reduce((s, r) => s + r.rating, 0) / arr.length : 0;

// { key: {avg,count} } from a list of reviews
export function groupAvg(reviews, key) {
  const m = {};
  reviews.forEach((r) => {
    (m[r[key]] = m[r[key]] || []).push(r);
  });
  const out = {};
  Object.keys(m).forEach((k) => {
    out[k] = { avg: avg(m[k]), count: m[k].length };
  });
  return out;
}

export const load = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? d;
  } catch {
    return d;
  }
};
export const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const ROLE_LABEL = {
  FARMER: "Farmer",
  BUYER: "Buyer",
  BUSINESS: "Business",
  ADMIN: "Admin",
};
export const ORDER_STATUSES = [
  "Order Placed",
  "Accepted",
  "Preparing",
  "Ready",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

// Market demand board computed with plain JavaScript (no AI)
export function demandBoard(reqs) {
  const m = {};
  reqs
    .filter((r) => r.status === "Open")
    .forEach((r) => {
      const k = r.productName.trim().toLowerCase();
      m[k] = m[k] || { name: r.productName.trim(), count: 0, qty: 0 };
      m[k].count += 1;
      m[k].qty += r.quantity || 0;
    });
  ["Tomato", "Onion", "Rice", "Mango", "Potato", "Turmeric"].forEach((n) => {
    if (!m[n.toLowerCase()]) m[n.toLowerCase()] = { name: n, count: 0, qty: 0 };
  });
  return Object.values(m)
    .map((x) => ({
      ...x,
      level:
        x.count >= 2 || x.qty >= 10000
          ? "High"
          : x.count === 1
            ? "Medium"
            : "Low",
    }))
    .sort((a, b) => b.count - a.count || b.qty - a.qty);
}
