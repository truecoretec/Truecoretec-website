import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import { api } from "@/lib/api";
import { usePageMeta } from "@/lib/seo";
import { PageHero, Breadcrumbs, SectionHeading, EmptyState, Skeleton } from "@/components/site/Primitives";
import { ProductCard } from "@/components/site/Cards";
import { WhatsAppInline } from "@/components/site/WhatsApp";
import { useEnquiryModal } from "@/components/site/EnquiryModal";
import NotFound from "@/pages/NotFound";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function IndustryDetail() {
  const { slug } = useParams();
  const { openEnquiry } = useEnquiryModal();
  const { data, error, isLoading } = useSWR(`/industries/${slug}`, fetcher, { revalidateOnFocus: false });
  const industry = data?.industry;

  usePageMeta({
    title: industry?.seo_title || (industry ? `${industry.name} | TrueCore Technologies` : "Industry"),
    description: industry?.seo_description || (industry?.overview || "").slice(0, 160),
  });

  if (error?.response?.status === 404) return <NotFound />;
  if (isLoading || !industry) return <Skeleton className="m-10 h-64" />;

  return (
    <>
      <PageHero eyebrow="Industry" title={industry.name} intro={industry.overview} />
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Industries", to: "/industries" }, { label: industry.name }]}
      />
      <div className="tc-section">
        <div className="tc-container">
          {industry.applications?.length > 0 && (
            <section>
              <SectionHeading eyebrow="Applications" title="Where our products are used" />
              <ul className="mt-8 grid gap-px border border-[#8A8F96]/30 bg-[#8A8F96]/30 sm:grid-cols-2 lg:grid-cols-3">
                {industry.applications.map((a) => (
                  <li key={a} className="bg-white p-5 text-[15px] text-[#3F434A]">{a}</li>
                ))}
              </ul>
            </section>
          )}

          {industry.requirements && (
            <section className="mt-16 max-w-3xl">
              <SectionHeading eyebrow="Requirements" title="Application-specific requirements" />
              <p className="mt-6 whitespace-pre-line text-[#3F434A]">{industry.requirements}</p>
            </section>
          )}

          {data.categories?.length > 0 && (
            <section className="mt-16">
              <SectionHeading eyebrow="Catalogue" title="Relevant product categories" />
              <div className="mt-8 flex flex-wrap gap-3">
                {data.categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/products/category/${c.slug}`}
                    className="border border-[#8A8F96]/40 px-4 py-2 text-[14px] font-medium text-[#003B7A] hover:border-[#10A6D8] hover:text-[#10A6D8]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-16">
            <SectionHeading eyebrow="Products" title="Suitable published products" />
            <div className="mt-8">
              {data.products?.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              ) : (
                <EmptyState
                  testId="industry-products-empty"
                  title="No published products linked yet"
                  message="We can engineer a solution to your drawing or application brief."
                />
              )}            </div>
          </section>

          <section className="mt-16 border-t border-[#8A8F96]/25 pt-10">
            <h2 className="text-2xl font-bold">Need an engineered or custom solution?</h2>
            <p className="mt-3 max-w-2xl text-[#3F434A]">
              Share the operating conditions, loads and drawings. Our team will assess suitability and respond.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button type="button" className="tc-btn-primary" data-testid="industry-quote-cta"
                onClick={() => openEnquiry({ title: `Enquiry — ${industry.name}`, industrySlug: industry.slug })}>
                Request Engineering Support
              </button>
              <WhatsAppInline context={`Industry enquiry: ${industry.name}`} testId="industry-whatsapp-button" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
