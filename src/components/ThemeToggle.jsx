import { useEffect, useState } from "react";
import { load, save } from "../utils.js";

export default function ThemeToggle() {
  const [t, setT] = useState(() => load("agro_theme", "dark"));
  useEffect(() => {
    document.documentElement.dataset.theme = t;
    save("agro_theme", t);
  }, [t]);
  return (
    <button
      className="nbtn"
      onClick={() => setT(t === "dark" ? "light" : "dark")}
      title="Toggle dark / light mode"
      aria-label="Toggle theme"
    >
      {t === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
