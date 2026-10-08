import { Link } from "../router.jsx";
import { useCart, useFav, useToast, useUser } from "../context/Contexts.jsx";
import { inr } from "../utils.js";
import { ProductImage, Rating } from "./Common.jsx";

export default function ProductCard({ product, rating, onCompare, compared }) {
  const { add } = useCart();
  const { isProduct, toggleProduct } = useFav();
  const { user } = useUser();
  const toast = useToast();
  const out = !(product.quantity > 0);
  const low = !out && product.quantity < 50;
  const fresh =
    product.harvestDate &&
    (Date.now() - new Date(product.harvestDate + "T00:00:00")) / 864e5 <= 3;
  const canBuy = !user || user.role === "BUYER" || user.role === "BUSINESS";

  return (
    <div className="pcard">
      <div className="imgwrap" style={{ position: "relative" }}>
        <Link to={"/products/" + product.id}>
          <ProductImage product={product} />
        </Link>
        {out && <div className="soldout">OUT OF STOCK</div>}
        <div className="tags">
          {fresh && !out && <span className="badge">✨ Fresh</span>}
          {product.farmingType === "Organic" && (
            <span className="badge">🌿 Organic</span>
          )}
          {low && <span className="badge amber">⚠ Low Stock</span>}
        </div>
        <button
          className="icon-btn fav"
          onClick={() => toggleProduct(product.id)}
          title="Favorite"
        >
          {isProduct(product.id) ? "❤️" : "🤍"}
        </button>
      </div>
      <div className="body">
        <span className="muted small">{product.category}</span>
        <h3>
          <Link to={"/products/" + product.id}>{product.productName}</Link>
        </h3>
        <div className="small muted">
          by{" "}
          <Link
            to={"/farmers/" + product.farmerId}
            style={{ color: "var(--green)", fontWeight: 600 }}
          >
            {product.farmName || product.farmerName}
          </Link>
        </div>
        <div className="small muted">📍 {product.location}</div>
        <Rating value={rating?.avg || 0} count={rating?.count} />
        <div className="row between" style={{ marginTop: 4 }}>
          <div className="price">
            {inr(product.price)}
            <small>/{product.unit}</small>
          </div>
          <div className="small muted">
            {out ? "0" : product.quantity} {product.unit} left
          </div>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          {canBuy && (
            <button
              className="btn btn-primary btn-sm"
              disabled={out}
              onClick={() => {
                add(product, 1);
                toast("Added " + product.productName + " to cart 🛒");
              }}
            >
              {out ? "Sold Out" : "Add to Cart"}
            </button>
          )}
          <Link className="btn btn-ghost btn-sm" to={"/products/" + product.id}>
            Details
          </Link>
          {onCompare && (
            <label
              className="small"
              style={{
                display: "flex",
                gap: 5,
                alignItems: "center",
                marginLeft: "auto",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                style={{ width: 16 }}
                checked={!!compared}
                onChange={() => onCompare(product.id)}
              />{" "}
              Compare
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
