import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/seo";

export default function NotFound() {
  usePageMeta({ title: "Page not found | TrueCore Technologies", noindex: true });
  return (
    <div className="tc-grid-bg" data-testid="not-found-page">
      <div className="tc-container flex min-h-[60vh] flex-col justify-center py-20">
        <p className="tc-eyebrow">Error 404</p>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">This page could not be found.</h1>
        <span className="tc-rule mt-6" />
        <p className="mt-6 max-w-xl text-[#3F434A]">
          The page may have moved or the product may no longer be published. Use the links below to continue.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link to="/" className="tc-btn-primary" data-testid="notfound-home-link">Home</Link>
          <Link to="/products" className="tc-btn-outline" data-testid="notfound-products-link">Products</Link>
          <Link to="/contact" className="tc-btn-outline" data-testid="notfound-contact-link">Contact</Link>
        </div>
      </div>
    </div>
  );
}
