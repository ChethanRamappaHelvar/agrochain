import { useEffect, useRef } from "react";
import { emojiFor } from "../data/catalog.js";
import { inr } from "../utils.js";

// Prop drilling example: PriceTicker -> PriceRow -> PriceItem (prices + onPick are passed down level by level)
function PriceItem({ p, onPick }) {
  const arrow = p.trend === "up" ? "▲" : p.trend === "down" ? "▼" : "▬";
  return (
    <button
      className="tick"
      onClick={() => onPick(p.name)}
      title={"Search " + p.name}
    >
      {emojiFor(p.name, p.category)} <b>{p.name}</b> {inr(p.price)}/{p.unit}{" "}
      <em className={"trend-" + p.trend}>{arrow}</em>
    </button>
  );
}

function PriceRow({ prices, onPick }) {
  return (
    <>
      {prices.map((p) => (
        <PriceItem key={p.name} p={p} onPick={onPick} />
      ))}
    </>
  );
}

export default function PriceTicker({ prices, onPick }) {
  const box = useRef();
  const paused = useRef(false);

  // gentle auto-scroll that pauses on hover / touch; the bar can also be scrolled manually
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const id = setInterval(() => {
      if (paused.current) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
        el.scrollLeft = 0;
      else el.scrollLeft += 1;
    }, 28);
    return () => clearInterval(id);
  }, [prices]);

  const by = (d) =>
    box.current && box.current.scrollBy({ left: d, behavior: "smooth" });
  const hold = (v) => () => {
    paused.current = v;
  };

  return (
    <div className="ticker-wrap">
      <span className="tk-label">
        <span className="live" />
        LIVE PRICES
      </span>
      <button
        className="tk-arrow"
        onClick={() => by(-320)}
        aria-label="Scroll left"
      >
        ‹
      </button>
      <div
        className="ticker"
        ref={box}
        onMouseEnter={hold(true)}
        onMouseLeave={hold(false)}
        onTouchStart={hold(true)}
        onTouchEnd={hold(false)}
      >
        <div className="ticker-track">
          <PriceRow prices={prices} onPick={onPick} />
        </div>
      </div>
      <button
        className="tk-arrow"
        onClick={() => by(320)}
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
  );
}
