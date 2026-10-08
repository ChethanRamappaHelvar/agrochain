import { Navigate, ParamContext, matchPath, useLocation } from "./router.jsx";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { useUser } from "./context/Contexts.jsx";
import Home from "./pages/Home.jsx";
import { Login, Register } from "./pages/Auth.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Compare from "./pages/Compare.jsx";
import Categories from "./pages/Categories.jsx";
import { Cart, Checkout } from "./pages/Cart.jsx";
import { Orders, OrderDetails } from "./pages/Orders.jsx";
import { Farmers, FarmerProfile } from "./pages/Farmers.jsx";
import Favorites from "./pages/Favorites.jsx";
import {
  Harvests,
  HarvestDetails,
  HarvestCalendar,
  Reservations,
} from "./pages/Harvests.jsx";
import {
  Requirements,
  RequirementDetails,
  ManageRequirements,
} from "./pages/Requirements.jsx";
import { Contracts, ManageContracts } from "./pages/Contracts.jsx";
import Market from "./pages/Market.jsx";
import Weather from "./pages/Weather.jsx";
import Trace from "./pages/Trace.jsx";
import { Notifications, Profile } from "./pages/Account.jsx";
import { About, Contact, NotFound } from "./pages/Static.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import {
  ManageProducts,
  Inventory,
  ManageHarvests,
  Revenue,
  FarmerReviews,
  FarmerOffers,
} from "./pages/FarmerPages.jsx";
import { ProfitCalculator, ShoppingList, Seasons } from "./pages/Tools.jsx";
import {
  AdminFarmers,
  AdminUsers,
  AdminProducts,
  AdminCategories,
  AdminOrders,
  AdminReviews,
  AdminMarket,
} from "./pages/Admin.jsx";

// Scroll-reveal animation for cards/sections (also catches content loaded later)
function useReveal() {
  useEffect(() => {
    const sel =
      ".card,.pcard,.cat-card,.stat,.sec-head,.demand,.cal,.notif,.how-step,.why,.testi,.faq,.table-wrap";
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.06 },
    );
    const mark = (el) => {
      if (el.dataset.rv) return;
      el.dataset.rv = "1";
      const i = Array.prototype.indexOf.call(
        el.parentNode ? el.parentNode.children : [],
        el,
      );
      el.style.transitionDelay = Math.min(Math.max(i, 0), 8) * 60 + "ms";
      el.classList.add("rv");
      io.observe(el);
    };
    const scan = (root) => {
      if (root.matches && root.matches(sel)) mark(root);
      root.querySelectorAll && root.querySelectorAll(sel).forEach(mark);
    };
    scan(document);
    const mo = new MutationObserver((ms) =>
      ms.forEach((m) =>
        m.addedNodes.forEach((nd) => nd.nodeType === 1 && scan(nd)),
      ),
    );
    mo.observe(document.getElementById("root"), {
      childList: true,
      subtree: true,
    });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const f = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  return show ? (
    <button
      className="btt"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      ↑
    </button>
  ) : null;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

const F = ["FARMER"],
  B = ["BUYER", "BUSINESS"],
  BZ = ["BUSINESS"],
  AD = ["ADMIN"];
// route table: path, page, optional login requirement (auth), roles, and dashboard layout (dash)
const ROUTES = [
  ["/", <Home />],
  ["/login", <Login />],
  ["/register", <Register />],
  ["/products", <Products />],
  ["/search", <Products />],
  ["/products/:id", <ProductDetails />],
  ["/compare", <Compare />],
  ["/categories", <Categories />],
  ["/cart", <Cart />],
  ["/farmers", <Farmers />],
  ["/farmers/:id", <FarmerProfile />],
  ["/harvests", <Harvests />],
  ["/harvests/:id", <HarvestDetails />],
  ["/calendar", <HarvestCalendar />],
  ["/requirements", <Requirements />],
  ["/requirements/:id", <RequirementDetails />],
  ["/contracts", <Contracts />],
  ["/market", <Market />],
  ["/weather", <Weather />],
  ["/seasons", <Seasons />],
  ["/trace", <Trace />],
  ["/about", <About />],
  ["/contact", <Contact />],
  ["/checkout", <Checkout />, { auth: true }],
  ["/dashboard", <Dashboard />, { dash: true }],
  ["/orders", <Orders />, { dash: true }],
  ["/orders/:id", <OrderDetails />, { dash: true }],
  ["/favorites", <Favorites />, { dash: true }],
  ["/reservations", <Reservations />, { dash: true }],
  ["/notifications", <Notifications />, { dash: true }],
  ["/profile", <Profile />, { dash: true }],
  ["/list", <ShoppingList />, { dash: true, roles: B }],
  ["/farmer/products", <ManageProducts />, { dash: true, roles: F }],
  ["/inventory", <Inventory />, { dash: true, roles: F }],
  ["/farmer/harvests", <ManageHarvests />, { dash: true, roles: F }],
  ["/farmer/offers", <FarmerOffers />, { dash: true, roles: F }],
  ["/revenue", <Revenue />, { dash: true, roles: F }],
  ["/farmer/reviews", <FarmerReviews />, { dash: true, roles: F }],
  ["/farmer/calculator", <ProfitCalculator />, { dash: true, roles: F }],
  ["/business/requirements", <ManageRequirements />, { dash: true, roles: BZ }],
  ["/business/contracts", <ManageContracts />, { dash: true, roles: BZ }],
  ["/admin/farmers", <AdminFarmers />, { dash: true, roles: AD }],
  ["/admin/users", <AdminUsers />, { dash: true, roles: AD }],
  ["/admin/products", <AdminProducts />, { dash: true, roles: AD }],
  ["/admin/categories", <AdminCategories />, { dash: true, roles: AD }],
  ["/admin/orders", <AdminOrders />, { dash: true, roles: AD }],
  ["/admin/reviews", <AdminReviews />, { dash: true, roles: AD }],
  ["/admin/market", <AdminMarket />, { dash: true, roles: AD }],
];

function DashLayout({ children }) {
  return (
    <div className="container page">
      <div className="dash">
        <Sidebar />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}

// picks the page for the current URL, applies login / role checks
function Pages() {
  const { pathname } = useLocation();
  const { user } = useUser();
  let found = null,
    params = {};
  for (const r of ROUTES) {
    const m = matchPath(r[0], pathname);
    if (m) {
      found = r;
      params = m;
      break;
    }
  }
  if (!found) return <NotFound />;
  const [, page, o = {}] = found;
  if ((o.auth || o.dash) && !user) return <Navigate to="/login" replace />;
  if (o.roles && !o.roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  const content = o.dash ? <DashLayout>{page}</DashLayout> : page;
  return (
    <ParamContext.Provider value={params}>{content}</ParamContext.Provider>
  );
}

export default function App() {
  const loc = useLocation();
  useReveal();
  return (
    <>
      <ScrollTop />
      <Navbar />
      <div className="fade" key={loc.pathname}>
        <Pages />
      </div>
      <Footer />
      <BackToTop />
    </>
  );
}
