import { useEffect, useState } from "react";
import { emojiFor, catGradient } from "../data/catalog.js";

export function Rating({ value = 0, onChange, count }) {
  const v = Math.round(value);
  if (onChange) {
    return (
      <div className="stars pick">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={n <= value ? "" : "off"}
            onClick={() => onChange(n)}
          >
            ★
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="stars" title={value ? value.toFixed(1) : "No ratings"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= v ? "" : "off"}>
          ★
        </span>
      ))}
      <span className="muted small" style={{ marginLeft: 6 }}>
        {value ? value.toFixed(1) : "New"}
        {count ? ` (${count})` : ""}
      </span>
    </span>
  );
}

export const Loading = ({ text = "Loading..." }) => (
  <div className="loading">
    <div className="spin" />
    <span>{text}</span>
  </div>
);

export const EmptyState = ({
  icon = "🌱",
  title = "Nothing here yet",
  text,
  children,
}) => (
  <div className="empty">
    <div className="e">{icon}</div>
    <h3>{title}</h3>
    {text && <p className="mt-s">{text}</p>}
    <div className="mt">{children}</div>
  </div>
);

export const ErrorBox = ({ message }) =>
  message ? (
    <div className="alert alert-err">
      <b>Oops!</b> {message}
    </div>
  ) : null;

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="row between">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="page-header">
    <div className="container row between">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>
);

export function CountUp({ to = 0, duration = 1300, prefix = "", suffix = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const n = Number(to) || 0;
    const step = (t) => {
      start = start || t;
      const p = Math.min((t - start) / duration, 1);
      setV(Math.round(n * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <>
      {prefix}
      {v.toLocaleString("en-IN")}
      {suffix}
    </>
  );
}

export const StatCard = ({ icon, label, value }) => {
  const m = typeof value === "string" ? /^₹([\d,.]+)$/.exec(value) : null;
  const shown =
    typeof value === "number" ? (
      <CountUp to={value} />
    ) : m ? (
      <CountUp to={Number(m[1].replace(/,/g, ""))} prefix="₹" />
    ) : (
      value
    );
  return (
    <div className="stat">
      <div className="ic">{icon}</div>
      <div>
        <b>{shown}</b>
        <span>{label}</span>
      </div>
    </div>
  );
};

export function Donut({ data, size = 150, center }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const stops = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const a = (acc / total) * 100;
      acc += d.value;
      return `${d.color} ${a}% ${(acc / total) * 100}%`;
    })
    .join(",");
  return (
    <div className="row" style={{ gap: 22 }}>
      <div
        className="donut"
        style={{
          width: size,
          height: size,
          background: total ? `conic-gradient(${stops})` : "var(--line)",
        }}
      >
        <span>{center ?? total}</span>
      </div>
      <div>
        {data.map((d) => (
          <div className="small" key={d.label} style={{ marginBottom: 4 }}>
            <i className="dotk" style={{ background: d.color }} />
            {d.label}: <b>{d.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export const SkeletonGrid = ({ n = 8 }) => (
  <div className="grid g4">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="pcard">
        <div className="skeleton" style={{ height: 170, borderRadius: 0 }} />
        <div className="body">
          <div className="skeleton" style={{ height: 12, width: "40%" }} />
          <div className="skeleton" style={{ height: 18, width: "75%" }} />
          <div className="skeleton" style={{ height: 12, width: "60%" }} />
          <div className="skeleton" style={{ height: 34, marginTop: 8 }} />
        </div>
      </div>
    ))}
  </div>
);

// emoji confetti shown after a successful order
export function burst() {
  const em = ["🎉", "🌾", "🍅", "🥭", "🌽", "✨", "🥕", "🍃"];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.textContent = em[i % em.length];
    s.style.left = Math.random() * 100 + "vw";
    s.style.fontSize = 16 + Math.random() * 18 + "px";
    s.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
    s.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4400);
  }
}

const BADGE = {
  delivered: "",
  verified: "",
  open: "",
  available: "",
  accepted: "",
  selected: "",
  confirmed: "",
  reserved: "blue",
  pending: "amber",
  "order placed": "blue",
  preparing: "amber",
  ready: "amber",
  dispatched: "blue",
  cancelled: "red",
  rejected: "red",
  blocked: "red",
  closed: "grey",
  "fully booked": "grey",
  "out of stock": "red",
  unread: "amber",
};
export const StatusBadge = ({ status }) => (
  <span className={"badge " + (BADGE[(status || "").toLowerCase()] ?? "grey")}>
    {status}
  </span>
);

export function ProductImage({ product, size = "md" }) {
  const [err, setErr] = useState(false);
  if (product.imageUrl && !err)
    return (
      <img
        className={"pimg " + size}
        src={product.imageUrl}
        alt={product.productName}
        onError={() => setErr(true)}
      />
    );
  return (
    <div
      className={"pimg tile " + size}
      style={{ background: catGradient(product.category) }}
    >
      <span>{emojiFor(product.productName, product.category)}</span>
    </div>
  );
}

const STEPS = [
  "Order Placed",
  "Accepted",
  "Preparing",
  "Ready",
  "Dispatched",
  "Delivered",
];
export function OrderTimeline({ status }) {
  if (status === "Cancelled")
    return <div className="alert alert-err">This order was cancelled.</div>;
  const idx = STEPS.indexOf(status);
  return (
    <div className="timeline">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={
            "tl " + (i <= idx ? "done " : "") + (i === idx ? "now" : "")
          }
        >
          <div className="dot">{i <= idx ? "✓" : i + 1}</div>
          {s}
        </div>
      ))}
    </div>
  );
}

export const initials = (n = "") =>
  n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
