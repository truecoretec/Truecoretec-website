import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { Search, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { usePageMeta } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { PageHero, Breadcrumbs, EmptyState, Skeleton } from "@/components/site/Primitives";
import { ProductCard } from "@/components/site/Cards";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get("q") || "");

  const query = useMemo(() => {
    const q = params.get("q") || "";
    const category = params.get("category") || "";
    const industry = params.get("industry") || "";
    const sort = params.get("sort") || "name";
    const page = params.get("page") || "1";
    const search = new URLSearchParams({ sort, page, page_size: "12" });
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    if (industry) search.set("industry", industry);
    return search.toString();
  }, [params]);

  const { data, isLoading } = useSWR(`/products?${query}`, fetcher, { revalidateOnFocus: false, keepPreviousData: true });
  const { data: categories } = useSWR("/categories", fetcher, { revalidateOnFocus: false });
  const { data: industries } = useSWR("/industries", fetcher, { revalidateOnFocus: false });

  usePageMeta({
    title: "Products | TrueCore Technologies Pvt. Ltd.",
    description: "Browse the TrueCore polyurethane product catalogue by category and industrial application.",
  });

  useEffect(() => {
    track("view_product_list");
  }, []);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
    if (key === "category" || key === "industry" || key === "sort") track("filter_products", { filter: key });
  };

  const onSearch = (e) => {
    e.preventDefault();
    update("q", term.trim());
    if (term.trim()) track("search_products");
  };

  const reset = () => {
    setTerm("");
    setParams(new URLSearchParams());
  };

  const hasFilters = ["q", "category", "industry"].some((k) => params.get(k));

  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title="Products"
        intro="Published products only. Specifications are displayed as supplied and approved by the company — unavailable fields are intentionally omitted."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Products" }]} />

      <div className="tc-section">
        <div className="tc-container">
          <div className="border border-[#8A8F96]/30 bg-white p-5 lg:p-6" data-testid="product-filter-bar">
            <form onSubmit={onSearch} className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label htmlFor="product-search" className="tc-label">Search catalogue</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3.5 text-[#8A8F96]" aria-hidden="true" />
                  <input
                    id="product-search"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Product name, code or keyword"
                    className="tc-input pl-9"
                    data-testid="product-search-input"
                  />
                </div>
              </div>
              <div className="lg:w-52">
                <label htmlFor="filter-category" className="tc-label">Category</label>
                <select
                  id="filter-category"
                  value={params.get("category") || ""}
                  onChange={(e) => update("category", e.target.value)}
                  className="tc-input"
                  data-testid="product-category-filter"
                >
                  <option value="">All categories</option>
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="lg:w-52">
                <label htmlFor="filter-industry" className="tc-label">Industry</label>
                <select
                  id="filter-industry"
                  value={params.get("industry") || ""}
                  onChange={(e) => update("industry", e.target.value)}
                  className="tc-input"
                  data-testid="product-industry-filter"
                >
                  <option value="">All industries</option>
                  {(industries || []).map((i) => (
                    <option key={i.id} value={i.slug}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div className="lg:w-44">
                <label htmlFor="filter-sort" className="tc-label">Sort by</label>
                <select
                  id="filter-sort"
                  value={params.get("sort") || "name"}
                  onChange={(e) => update("sort", e.target.value)}
                  className="tc-input"
                  data-testid="product-sort-select"
                >
                  <option value="name">Name</option>
                  <option value="recent">Recently added</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
              <button type="submit" className="tc-btn-primary" data-testid="product-search-submit">
                <SlidersHorizontal size={16} aria-hidden="true" /> Apply
              </button>
            </form>
            {hasFilters && (
              <button type="button" onClick={reset} className="tc-btn-ghost mt-4 text-[13px]" data-testid="product-reset-filters">
                Reset filters
              </button>
            )}
          </div>

          <div className="mt-8" aria-live="polite">
            {isLoading && !data ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-80" />)}
              </div>
            ) : data?.items?.length ? (
              <>
                <p className="tc-eyebrow mb-6" data-testid="product-result-count">
                  {data.total} product{data.total === 1 ? "" : "s"} found
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {data.pages > 1 && (
                  <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                    {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update("page", String(n))}
                        className={`h-10 w-10 border text-sm font-semibold ${
                          n === data.page
                            ? "border-[#003B7A] bg-[#003B7A] text-white"
                            : "border-[#8A8F96]/40 text-[#3F434A] hover:border-[#10A6D8] hover:text-[#10A6D8]"
                        }`}
                        aria-current={n === data.page ? "page" : undefined}
                        data-testid={`product-page-${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </nav>
                )}
              </>
            ) : (
              <EmptyState
                testId="product-empty-state"
                title={hasFilters ? "No products match your filters" : "Catalogue publishing in progress"}
                message={
                  hasFilters
                    ? "Try a different keyword or clear the filters. We can also quote against your drawing or specification."
                    : "Products are being prepared and approved for publication. Share your requirement and our team will respond with suitable options."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-4">
                    {hasFilters && (
                      <button type="button" onClick={reset} className="tc-btn-outline" data-testid="empty-reset-filters">
                        Reset filters
                      </button>
                    )}
                    <Link to="/request-quote" className="tc-btn-primary" data-testid="empty-custom-requirement">
                      Custom Requirement
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
