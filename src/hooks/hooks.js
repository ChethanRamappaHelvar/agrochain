import { useEffect, useState } from "react";
import { api } from "../api.js";
import { CATEGORIES } from "../data/catalog.js";

// Categories come from the backend (admin managed) with a built-in fallback
export function useCategories() {
  const [cats, setCats] = useState(CATEGORIES);
  useEffect(() => {
    api
      .get("/categories")
      .then((d) => {
        if (Array.isArray(d) && d.length) {
          const sorted = [...d].sort((a, b) => a.id - b.id);
          setCats(
            sorted.map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon || "🌿",
              items: CATEGORIES.find((x) => x.name === c.name)?.items || [],
            })),
          );
        }
      })
      .catch(() => {});
  }, []);
  return cats;
}

// Generic loader: const {data,loading,error,reload} = useApi("/products")
export function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get(path)
      .then((d) => {
        if (alive) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line
  }, [path, tick, ...deps]);
  return { data, loading, error, reload: () => setTick((t) => t + 1), setData };
}

const WCODE = (c) => {
  if (c === 0) return ["Clear sky", "☀️"];
  if (c <= 3) return ["Partly cloudy", "⛅"];
  if (c === 45 || c === 48) return ["Foggy", "🌫️"];
  if (c >= 51 && c <= 57) return ["Drizzle", "🌦️"];
  if (c >= 61 && c <= 67) return ["Rainy", "🌧️"];
  if (c >= 71 && c <= 77) return ["Snow", "❄️"];
  if (c >= 80 && c <= 82) return ["Rain showers", "🌦️"];
  if (c >= 95) return ["Thunderstorm", "⛈️"];
  return ["Cloudy", "☁️"];
};

// External API (Open-Meteo, free, no key) using the Fetch API
export async function getWeather(city) {
  const g = await fetch(
    "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" +
      encodeURIComponent(city),
  ).then((r) => r.json());
  if (!g.results || !g.results.length) throw new Error("Location not found");
  const { latitude, longitude, name, admin1 } = g.results[0];
  const w = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`,
  ).then((r) => r.json());
  const hour = parseInt((w.current.time || "T00").slice(11, 13), 10) || 0;
  const [condition, icon] = WCODE(w.current.weather_code);
  return {
    place: name + (admin1 ? ", " + admin1 : ""),
    temp: Math.round(w.current.temperature_2m),
    humidity: w.current.relative_humidity_2m,
    wind: w.current.wind_speed_10m,
    rain: w.hourly?.precipitation_probability?.[hour] ?? 0,
    condition,
    icon,
  };
}
