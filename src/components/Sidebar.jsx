import { NavLink } from "../router.jsx";
import { useUser } from "../context/Contexts.jsx";
import { initials } from "./Common.jsx";

const MENUS = {
  FARMER: [
    ["/dashboard", "📊", "Overview"],
    ["/farmer/products", "🧺", "My Products"],
    ["/inventory", "📦", "Inventory"],
    ["/orders", "🧾", "Orders"],
    ["/farmer/harvests", "🌱", "Future Harvests"],
    ["/farmer/offers", "💼", "My Offers"],
    ["/revenue", "💰", "Revenue"],
    ["/farmer/calculator", "🧮", "Profit Calculator"],
    ["/farmer/reviews", "⭐", "Reviews"],
    ["/notifications", "🔔", "Notifications"],
    ["/profile", "👤", "Profile"],
  ],
  BUYER: [
    ["/dashboard", "📊", "Overview"],
    ["/orders", "🧾", "My Orders"],
    ["/favorites", "❤️", "Favorites"],
    ["/reservations", "🌱", "Harvest Reservations"],
    ["/list", "📝", "Shopping List"],
    ["/notifications", "🔔", "Notifications"],
    ["/profile", "👤", "Profile"],
  ],
  BUSINESS: [
    ["/dashboard", "📊", "Overview"],
    ["/business/requirements", "📝", "My Requirements"],
    ["/business/contracts", "📃", "My Contracts"],
    ["/orders", "🧾", "Orders"],
    ["/reservations", "🌱", "Harvest Reservations"],
    ["/list", "📝", "Shopping List"],
    ["/favorites", "❤️", "Favorites"],
    ["/notifications", "🔔", "Notifications"],
    ["/profile", "👤", "Profile"],
  ],
  ADMIN: [
    ["/dashboard", "📊", "Overview"],
    ["/admin/farmers", "✅", "Farmer Verification"],
    ["/admin/users", "👥", "Users"],
    ["/admin/products", "🧺", "Products"],
    ["/admin/categories", "🗂️", "Categories"],
    ["/admin/orders", "🧾", "Orders"],
    ["/admin/reviews", "⭐", "Reviews"],
    ["/admin/market", "📋", "Requirements & Harvests"],
  ],
};

export default function Sidebar() {
  const { user, farmer } = useUser();
  const items = MENUS[user.role] || [];
  return (
    <aside className="sidebar">
      <div className="who">
        <div className="row">
          <span className="avatar">{initials(user.name)}</span>
          <div>
            <b>{user.name}</b>
            <div className="muted small">
              {user.role === "FARMER"
                ? "Farmer"
                : user.role === "BUSINESS"
                  ? user.businessType || "Business"
                  : user.role === "ADMIN"
                    ? "Administrator"
                    : "Buyer"}
            </div>
          </div>
        </div>
        {farmer && (
          <div className="mt-s small">
            {farmer.verificationStatus === "Verified" ? (
              <span className="verified">✓ Verified Farmer</span>
            ) : (
              <span className="badge amber">{farmer.verificationStatus}</span>
            )}
          </div>
        )}
      </div>
      {items.map(([to, ic, label]) => (
        <NavLink key={to} to={to} end={to === "/dashboard"}>
          <span>{ic}</span>
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
