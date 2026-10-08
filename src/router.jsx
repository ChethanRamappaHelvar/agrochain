// Tiny hand-written router (plain React: useState + useEffect + Context API).
// Pages live at URLs like  index.html#/products?category=Fruits
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const parse = () => {
  const h = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = h.split("?");
  return { pathname: path || "/", search: query ? "?" + query : "" };
};

const LocationContext = createContext({ pathname: "/", search: "" });
export const ParamContext = createContext({});

export function RouterProvider({ children }) {
  const [loc, setLoc] = useState(parse);
  useEffect(() => {
    const onChange = () => setLoc(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return (
    <LocationContext.Provider value={loc}>{children}</LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
export const useParams = () => useContext(ParamContext);

export function useNavigate() {
  return (to, opts) => {
    if (opts && opts.replace) window.location.replace("#" + to);
    else window.location.hash = to;
  };
}

export function useSearchParams() {
  const { pathname, search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const navigate = useNavigate();
  return [
    params,
    (next) => navigate(pathname + "?" + new URLSearchParams(next).toString()),
  ];
}

export function Link({ to, children, ...rest }) {
  return (
    <a href={"#" + to} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, end, className = "", children, ...rest }) {
  const { pathname } = useLocation();
  const on = end
    ? pathname === to
    : pathname === to || pathname.startsWith(to + "/");
  return (
    <a href={"#" + to} className={className + (on ? " active" : "")} {...rest}>
      {children}
    </a>
  );
}

export function Navigate({ to, replace }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, []); // eslint-disable-line
  return null;
}

// "/products/:id" + "/products/5"  ->  { id: "5" }   (null when it does not match)
export function matchPath(pattern, path) {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] === ":") params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
