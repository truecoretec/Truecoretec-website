import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import { FileText, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { usePageMeta, useStructuredData } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { Breadcrumbs, SectionHeading, Skeleton } from "@/components/site/Primitives";
import { ProductCard } from "@/components/site/Cards";
import { WhatsAppInline } from "@/components/site/WhatsApp";
import { useEnquiryModal } from "@/components/site/EnquiryModal";
import NotFound from "@/pages/NotFound";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function ProductDetail() {
  const { slug } = useParams();
  const { openEnquiry } = useEnquiryModal();
  const { data, error, isLoading } = useSWR(`/products/${slug}`, fetcher, { revalidateOnFocus: false });
  const [active, setActive] = useState(0);

  const product = data?.product;
  usePageMeta({
    title: product?.seo_title || (product ? `${product.name} | TrueCore Technologies` : "Product"),
    description: product?.seo_description || product?.summary,
    image: product?.image_url,
  });
  useStructuredData(
    product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.product_code || undefined,
          description: product.summary || undefined,
          image: product.image_url || undefined,
          brand: { "@type": "Brand", name: "TrueCore Technologies Pvt. Ltd." },
        }
      : null
  );

  useEffect(() => {
    if (product) track("view_product", { product_slug: product.slug });
  }, [product]);

  if (error?.response?.status === 404) return <NotFound />;
  if (isLoading || !product) {
    return (
      <div className="tc-container tc-section">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-6 h-72 w-full" />
      </div>
    );
  }

  const gallery = [product.image_url, ...(product.gallery || [])].filter(Boolean);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Products", to: "/products" },
          ...(data.category ? [{ label: data.category.name, to: `/products/category/${data.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="tc-section">
        <div className="tc-container grid gap-12 lg:grid-cols-2">
          <div>
            <div className="border border-[#8A8F96]/30 bg-[#EDEDED]">
              {gallery.length ? (
                <img
                  src={gallery[active]}
                  alt={product.name}
                  className="aspect-[4/3] w-full object-cover"
                  data-testid="product-main-image"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center">
                  <span className="tc-eyebrow">Product image pending approval</span>
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3">
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`h-20 w-24 border ${i === active ? "border-[#10A6D8]" : "border-[#8A8F96]/30"}`}
                    aria-label={`View image ${i + 1}`}
                    data-testid={`product-thumb-${i}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {data.category && <p className="tc-eyebrow">{data.category.name}</p>}
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
            {product.product_code && (
              <p className="tc-mono mt-2 text-sm text-[#8A8F96]">CODE: {product.product_code}</p>
            )}
            <span className="tc-rule mt-6" />
            {product.summary && <p className="mt-6 text-lg text-[#3F434A]">{product.summary}</p>}
            {product.description && (
              <p className="mt-4 whitespace-pre-line text-[#3F434A]">{product.description}</p>
            )}

            {product.applications?.length > 0 && (
              <div className="mt-8">
                <p className="tc-eyebrow">Typical Applications</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {product.applications.map((a) => (
                    <li key={a} className="border border-[#8A8F96]/40 px-3 py-1 text-[13px] text-[#3F434A]">{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.industries?.length > 0 && (
              <div className="mt-6">
                <p className="tc-eyebrow">Industries</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {data.industries.map((i) => (
                    <Link key={i.id} to={`/industries/${i.slug}`} className="text-[14px] font-medium text-[#10A6D8] hover:text-[#003B7A]">
                      {i.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                className="tc-btn-primary"
                onClick={() => openEnquiry({ title: `Request a Quote — ${product.name}`, productSlug: product.slug })}
                data-testid="product-request-quote"
              >
                Request a Quote <ArrowRight size={16} aria-hidden="true" />
              </button>
              <WhatsAppInline context={`Product of interest: ${product.name}`} testId="product-whatsapp-button" />
            </div>
          </div>
        </div>

        {product.specifications?.length > 0 && (
          <div className="tc-container mt-16">
            <SectionHeading eyebrow="Technical Data" title="Specifications" />
            <div className="mt-8 overflow-x-auto border border-[#8A8F96]/30">
              <table className="w-full min-w-[520px] border-collapse text-left" data-testid="product-spec-table">
                <caption className="sr-only">Approved technical specifications for {product.name}</caption>
                <thead className="bg-[#EDEDED]">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-[#003B7A]">Parameter</th>
                    <th scope="col" className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-[#003B7A]">Value</th>
                    <th scope="col" className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-[#003B7A]">Unit</th>
                    <th scope="col" className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-[#003B7A]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {product.specifications.map((s) => (
                    <tr key={s.label} className="border-t border-[#8A8F96]/25">
                      <th scope="row" className="px-4 py-3 text-[14px] font-medium text-[#3F434A]">{s.label}</th>
                      <td className="tc-mono px-4 py-3 text-[14px] text-[#003B7A]">{s.value}</td>
                      <td className="px-4 py-3 text-[14px] text-[#8A8F96]">{s.unit || "—"}</td>
                      <td className="px-4 py-3 text-[14px] text-[#3F434A]">{s.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {product.variants?.length > 0 && (
          <div className="tc-container mt-16">
            <SectionHeading eyebrow="Options" title="Variants, sizes & grades" />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.variants.map((v) => (
                <li key={v.name} className="tc-card p-5">
                  <p className="font-semibold text-[#003B7A]">{v.name}</p>
                  {v.detail && <p className="mt-2 text-[14px] text-[#3F434A]">{v.detail}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.documents?.length > 0 && (
          <div className="tc-container mt-16">
            <SectionHeading eyebrow="Downloads" title="Technical documents" />
            <ul className="mt-6 space-y-3">
              {product.documents.map((d) => (
                <li key={d.url}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("document_download", { product_slug: product.slug })}
                    className="inline-flex items-center gap-2 text-[15px] font-medium text-[#10A6D8] hover:text-[#003B7A]"
                    data-testid="product-document-link"
                  >
                    <FileText size={16} aria-hidden="true" /> {d.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.related?.length > 0 && (
          <div className="tc-container mt-20">
            <SectionHeading eyebrow="Also consider" title="Related products" />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
