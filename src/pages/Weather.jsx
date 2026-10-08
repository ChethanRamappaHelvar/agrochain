import { useEffect, useState } from "react";
import { getWeather } from "../hooks/hooks.js";
import { useUser } from "../context/Contexts.jsx";
import { PageHeader } from "../components/Common.jsx";

export function WeatherWidget({ city }) {
  const [w, setW] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setW(null); setErr("");
    getWeather(city).then(setW).catch((e) => setErr(e.message || "Weather unavailable"));
  }, [city]);
  if (err) return <div className="weather"><h3>🌦️ Weather</h3><p style={{ color: "#e3f0ff" }}>{err}. Check your internet connection or try another place.</p></div>;
  if (!w) return <div className="weather"><h3>🌦️ Loading weather…</h3></div>;
  return (
    <div className="weather">
      <div className="row between"><h3>📍 {w.place}</h3><span style={{ fontSize: 44 }}>{w.icon}</span></div>
      <div className="big mt-s">{w.temp}°C</div><div style={{ color: "#e3f0ff" }}>{w.condition}</div>
      <div className="advisory">{w.rain >= 60 ? "☔ High rain chance: cover produce and delay harvest." : w.temp >= 34 ? "🌡️ Very hot: harvest early morning and keep produce shaded." : "✅ Good conditions for field work and deliveries."}</div>
      <div className="grid g3 mt" style={{ gap: 10 }}>
        <div><b>🌧 {w.rain}%</b><div className="small" style={{ color: "#d6e8ff" }}>Rain chance</div></div>
        <div><b>💧 {w.humidity}%</b><div className="small" style={{ color: "#d6e8ff" }}>Humidity</div></div>
        <div><b>🌬 {w.wind} km/h</b><div className="small" style={{ color: "#d6e8ff" }}>Wind</div></div>
      </div>
    </div>
  );
}

export default function Weather() {
  const { farmer } = useUser();
  const [input, setInput] = useState(farmer?.village || "Anekal");
  const [city, setCity] = useState(farmer?.village || "Anekal");
  return (
    <>
      <PageHeader title="🌦️ Farm Weather" subtitle="Plan sowing, harvest and delivery with live weather" />
      <div className="container page" style={{ maxWidth: 720 }}>
        <form className="row mb" onSubmit={(e) => { e.preventDefault(); input.trim() && setCity(input.trim()); }}>
          <input style={{ flex: 1, borderRadius: 999 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter village / town (e.g. Anekal)" />
          <button className="btn btn-primary">Check Weather</button>
        </form>
        <WeatherWidget city={city} />
        <div className="alert alert-info mt small">Data from Open-Meteo (free external API) fetched with the Fetch API and useEffect().</div>
      </div>
    </>
  );
}
