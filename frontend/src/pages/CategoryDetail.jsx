import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePageMeta } from "@/lib/seo";
import { Breadcrumbs, PageHero, EmptyState, Skeleton } from "@/components/site/Primitives";
import { ProductCard } from "@/components/site/Cards";
import NotFound from "@/pages/NotFound";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function CategoryDetail() {
  const { slug } = useParams();
  const { data, error, isLoading } = useSWR(`/categories/${slug}`, fetcher, { revalidateOnFocus: false });
  const category = data?.category;

  usePageMeta({
    title: category?.seo_title || (category ? `${category.name} | TrueCore Products` : "Category"),
    description: category?.seo_description || category?.summary,
  });

  if (error?.response?.status === 404) return <NotFound />;
  if (isLoading || !category) return <Skeleton className="m-10 h-64" />;

  return (
    <>
      <PageHero eyebrow="Product Category" title={category.name} intro={category.summary} />
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Products", to: "/products" }, { label: category.name }]}
      />
      <div className="tc-section">
        <div className="tc-container">
          {category.description && (
            <p className="max-w-3xl whitespace-pre-line text-[#3F434A]">{category.description}</p>
          )}
          <div className="mt-10">
            {data.products.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.products.map((p) => <ProductCard key={p.id} product={{ ...p, category }} />)}
              </div>
            ) : (
              <EmptyState
                testId="category-empty-state"
                title="No published products in this category yet"
                message="Products for this category are being prepared. Share your requirement and we will respond with suitable options."
                action={<Link to="/request-quote" className="tc-btn-primary">Request a Quote</Link>}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
