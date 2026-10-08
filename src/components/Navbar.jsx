import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "../router.jsx";
import { useCart, useLang, useUser } from "../context/Contexts.jsx";
import { api } from "../api.js";
import { initials } from "./Common.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Navbar() {
  const { user, logout, farmer } = useUser();
  const { count } = useCart();
  const { lang, setLang, t } = useLang();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const [active, setActive] = useState(0);
  const sref = useRef();
  useEffect(() => {
    const k = (e) => {
      if (
        e.key === "/" &&
        !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)
      ) {
        e.preventDefault();
        sref.current && sref.current.focus();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [names, setNames] = useState(null);
  const [showSug, setShowSug] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", f);
    f();
    return () => window.removeEventListener("scroll", f);
  }, []);
  const loadNames = () =>
    names ||
    api
      .get("/products")
      .then((p) =>
        setNames([
          ...new Set(
            p.flatMap((x) => [x.productName, x.farmName]).filter(Boolean),
          ),
        ]),
      )
      .catch(() => setNames([]));
  const sug =
    q.trim() && names
      ? names
          .filter((x) => x.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 6)
      : [];
  const go = (text) => {
    setShowSug(false);
    setQ("");
    close();
    nav("/products?q=" + encodeURIComponent(text));
  };

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const load = () =>
      api
        .get("/notifications?userId=" + user.id)
        .then((n) => setUnread(n.filter((x) => x.status === "Unread").length))
        .catch(() => {});
    const loadOrders = () =>
      user.role === "ADMIN"
        ? null
        : api
            .get(
              "/orders?" +
                (user.role === "FARMER"
                  ? "farmerId=" + (farmer?.id ?? 0)
                  : "buyerId=" + user.id),
            )
            .then((o) =>
              setActive(
                o.filter((x) => !["Delivered", "Cancelled"].includes(x.status))
                  .length,
              ),
            )
            .catch(() => {});
    load();
    loadOrders();
    const id = setInterval(() => {
      load();
      loadOrders();
    }, 20000);
    return () => clearInterval(id);
  }, [user]);

  const close = () => {
    setOpen(false);
    setMenu(false);
  };
  const extra =
    user && user.role !== "ADMIN"
      ? [
          [
            "/orders",
            <>Orders{active > 0 && <span className="nb">{active}</span>}</>,
          ],
          ...(user.role !== "FARMER" ? [["/favorites", "Wishlist"]] : []),
        ]
      : [];
  const links = [
    ["/", t("home"), true],
    ["/products", t("products")],
    ["/farmers", t("farmers")],
    ["/harvests", t("harvests")],
    ["/requirements", t("bulk")],
    ["/market", t("prices")],
    ...extra,
  ];

  return (
    <header className={"navbar" + (scrolled ? " scrolled" : "")}>
      <div className="container nav-in">
        <Link to="/" className="logo" onClick={close}>
          <span className="lg">AC</span>
          <div className="lt">
            Agro<span>Chain</span>
            <small>From Farm to Market, Directly.</small>
          </div>
        </Link>
        <nav className={"nav-links" + (open ? " open" : "")}>
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} onClick={close}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={"nav-right" + (open ? " open" : "")}>
          <form
            className="nav-search"
            onSubmit={(e) => {
              e.preventDefault();
              q.trim() && go(q.trim());
            }}
          >
            <input
              ref={sref}
              value={q}
              placeholder="🔍 Search produce  ( / )"
              onChange={(e) => {
                setQ(e.target.value);
                setShowSug(true);
              }}
              onFocus={() => {
                loadNames();
                setShowSug(true);
              }}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
            />
            {showSug && sug.length > 0 && (
              <div className="suggest">
                {sug.map((x) => (
                  <button type="button" key={x} onMouseDown={() => go(x)}>
                    🔎 {x}
                  </button>
                ))}
              </div>
            )}
          </form>
          <ThemeToggle />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
          {(!user || (user.role !== "FARMER" && user.role !== "ADMIN")) && (
            <Link to="/cart" className="nbtn" title={t("cart")} onClick={close}>
              🛒{count > 0 && <span className="dot">{count}</span>}
            </Link>
          )}
          {user ? (
            <>
              <Link
                to="/notifications"
                className="nbtn"
                title="Notifications"
                onClick={close}
              >
                🔔{unread > 0 && <span className="dot">{unread}</span>}
              </Link>
              <div className="usermenu">
                <button
                  className="avatar"
                  onClick={() => setMenu(!menu)}
                  aria-label="Account"
                >
                  {initials(user.name)}
                </button>
                {menu && (
                  <div className="drop">
                    <div style={{ padding: "8px 12px" }}>
                      <b>{user.name}</b>
                      <div className="muted small">{user.role}</div>
                    </div>
                    <Link to="/dashboard" onClick={close}>
                      📊 {t("dashboard")}
                    </Link>
                    {user.role !== "ADMIN" && (
                      <Link to="/orders" onClick={close}>
                        📦 Orders
                      </Link>
                    )}
                    {user.role !== "ADMIN" && (
                      <Link to="/profile" onClick={close}>
                        👤 Profile
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        close();
                        nav("/");
                      }}
                    >
                      🚪 {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
                onClick={close}
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={close}
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
        <button
          className="burger"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}
