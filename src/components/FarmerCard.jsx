import { Link } from "../router.jsx";
import { useFav } from "../context/Contexts.jsx";
import { initials, Rating } from "./Common.jsx";

export default function FarmerCard({ farmer, rating }) {
  const { isFarmer, toggleFarmer } = useFav();
  return (
    <div className="card hover fcard" style={{ position: "relative" }}>
      <button
        className="icon-btn"
        style={{ position: "absolute", top: 12, right: 12 }}
        onClick={() => toggleFarmer(farmer.id)}
      >
        {isFarmer(farmer.id) ? "❤️" : "🤍"}
      </button>
      <div className="fimg">{initials(farmer.name)}</div>
      <h3>{farmer.name}</h3>
      <div className="bold" style={{ color: "var(--green)" }}>
        {farmer.farmName}
      </div>
      <div className="muted small">
        📍 {farmer.location} &nbsp;•&nbsp; {farmer.farmSize} acres
      </div>
      <div className="mt-s">
        <Rating value={rating?.avg || 0} count={rating?.count} />
      </div>
      <div className="mt-s">
        {farmer.verificationStatus === "Verified" ? (
          <span className="verified">✓ Verified Farmer</span>
        ) : (
          <span className="badge amber">{farmer.verificationStatus}</span>
        )}
      </div>
      <div className="small muted mt-s">🌱 {farmer.mainCrops}</div>
      <Link to={"/farmers/" + farmer.id} className="btn btn-outline btn-sm mt">
        View Profile
      </Link>
    </div>
  );
}
