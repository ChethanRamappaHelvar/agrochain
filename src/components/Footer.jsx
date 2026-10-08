import { Link } from "../router.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid g4">
          <div>
            <h4>🌾 AgroChain</h4>
            <p className="small">
              A farm-to-business agricultural commerce platform connecting
              farmers directly with buyers, retailers, hotels, restaurants and
              companies.
            </p>
          </div>
          <div>
            <h4>Marketplace</h4>
            <Link to="/products">Products</Link>
            <Link to="/harvests">Future Harvests</Link>
            <Link to="/requirements">Bulk Requirements</Link>
            <Link to="/contracts">Contract Farming</Link>
            <Link to="/seasons">Seasonal Guide</Link>
          </div>
          <div>
            <h4>Community</h4>
            <Link to="/farmers">Farmers</Link>
            <Link to="/register">For Buyers</Link>
            <Link to="/register">For Businesses</Link>
            <Link to="/trace">Trace a Crop Lot</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/about">Privacy</Link>
            <Link to="/about">Terms</Link>
          </div>
        </div>
        <div className="copy">
          © 2026 AgroChain - Grow. Connect. Trade. &nbsp;|&nbsp; 🌱 📘 📸 ▶️
        </div>
      </div>
    </footer>
  );
}
