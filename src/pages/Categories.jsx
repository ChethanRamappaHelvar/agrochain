import { Link } from "../router.jsx";
import { useCategories } from "../hooks/hooks.js";
import { PageHeader } from "../components/Common.jsx";

export default function Categories() {
  const cats = useCategories();
  return (
    <>
      <PageHeader title="🗂️ Product Categories" subtitle="Browse every crop and farm product" />
      <div className="container page">
        <div className="grid g2">
          {cats.map((c) => (
            <div className="card" key={c.name}>
              <div className="row between"><h3>{c.icon} {c.name}</h3><Link className="btn btn-outline btn-sm" to={"/products?category=" + encodeURIComponent(c.name)}>View all</Link></div>
              <div className="row mt">{c.items.map((i) => <Link key={i} to={"/products?q=" + encodeURIComponent(i)} className="chip">{i}</Link>)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
