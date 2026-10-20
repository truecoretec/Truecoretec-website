import { Link } from "react-router-dom";
import useSWR from "swr";
import { ArrowRight, Boxes, Cog, Layers, Microscope } from "lucide-react";
import { api } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import { usePageMeta, useStructuredData } from "@/lib/seo";
import { SectionHeading } from "@/components/site/Primitives";
import { ProductCard, SimpleCard } from "@/components/site/Cards";
import { WhatsAppInline } from "@/components/site/WhatsApp";
import { useEnquiryModal } from "@/components/site/EnquiryModal";

const fetcher = (url) => api.get(url).then((r) => r.data);
const OFFERING_ICONS = [Layers, Cog, Boxes, Microscope];

const section = (page, key) => page?.sections?.find((s) => s.key === key);
const lines = (body) => (body || "").split("\n").map((l) => l.trim()).filter(Boolean);

export default function Home() {
  const { settings } = useSite();
  const { openEnquiry } = useEnquiryModal();
  const { data: page } = useSWR("/pages/home", fetcher, { revalidateOnFocus: false });
  const { data: categories } = useSWR("/categories", fetcher, { revalidateOnFocus: false });
  const { data: industries } = useSWR("/industries", fetcher, { revalidateOnFocus: false });
  const { data: featured } = useSWR("/products?featured=true&page_size=3", fetcher, { revalidateOnFocus: false });

  usePageMeta({
    title: page?.seo_title || settings?.default_seo_title || "TrueCore Technologies Pvt. Ltd.",
    description: page?.seo_description || settings?.default_seo_description,
  });
  useStructuredData({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TrueCore Technologies Pvt. Ltd.",
    slogan: "Advanced Materials. A Stronger Tomorrow.",
    description: settings?.default_seo_description,
    url: window.location.origin,
  });

  const hero = section(page, "hero");
  const about = section(page, "about");
  const offerings = section(page, "offerings");
  const tech = section(page, "technology");
  const why = section(page, "why");
  const cta = section(page, "cta");

  return (
    <>
      {/* Hero */}
      <section className="tc-grid-bg relative border-b border-[#8A8F96]/20 bg-white" data-testid="home-hero">
        <div className="tc-container grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="tc-reveal">
            <p className="tc-eyebrow">Engineered Material Solutions</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              {hero?.heading || settings?.tagline || "Advanced Materials. A Stronger Tomorrow."}
            </h1>
            <span className="tc-rule mt-7" />
            <h2 className="mt-7 text-base font-semibold text-[#003B7A] md:text-lg">
              {hero?.subheading || settings?.positioning || "Manufacturers of High-Performance PU Products"}
            </h2>
            <p className="mt-4 max-w-xl text-[#3F434A]">
              {hero?.body || "Engineered polyurethane solutions for demanding industrial applications."}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/products" className="tc-btn-primary" data-testid="hero-explore-products">
                Explore Products <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <button type="button" className="tc-btn-outline" data-testid="hero-request-quote"
                onClick={() => openEnquiry({ title: "Request a Quote" })}>
                Request a Quote
              </button>
            </div>
            <dl className="mt-12 grid max-w-2xl gap-8 border-t border-[#8A8F96]/25 pt-7 sm:grid-cols-3">
              {[section(page, "hero_applications"), section(page, "hero_materials"), section(page, "hero_sectors")]
                .filter(Boolean)
                .map((block) => (
                  <div key={block.key} data-testid={`hero-block-${block.key}`}>
                    <dt className="tc-eyebrow">{block.heading}</dt>
                    <dd className="mt-3 space-y-1.5">
                      {lines(block.body).map((item) => (
                        <span key={item} className="block text-[13.5px] font-medium text-[#3F434A]">
                          {item}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
          <div className="tc-reveal relative" style={{ animationDelay: "120ms" }}>
            <div className="border border-[#8A8F96]/30 bg-[#EDEDED]">
              <img
                src="https://static.prod-images.emergentagent.com/jobs/2aef6c48-2f9a-4860-9f17-68ffcdeff4d1/images/9e72299c8355693c4da33764e3512440c807cf25754ed9ccf8071fcfbd25f26f.jpeg"
                alt="High-performance polyurethane and TPU engineered components — rollers, wheels, bushes, pads and precision moulded parts — with injection mould tooling in a clean engineering environment"
                className="aspect-[4/3] w-full object-cover"
                width="1264"
                height="848"
              />
            </div>
            <p className="mt-3 text-[12px] text-[#8A8F96]">
              Representative industrial imagery. Not a depiction of TrueCore facilities or products.
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="tc-section" data-testid="home-about">
        <div className="tc-container grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading eyebrow="About TrueCore" title={about?.heading || "About TrueCore"} />
          <div>
            <p className="text-lg leading-relaxed text-[#3F434A]">{about?.body}</p>
            <Link to="/about" className="tc-btn-ghost mt-6 text-[13px]" data-testid="home-about-link">
              More about the company <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Offerings */}
      {offerings && (
        <section className="tc-section bg-[#EDEDED]/70" data-testid="home-offerings">
          <div className="tc-container">
            <SectionHeading
              eyebrow="Engineered for application. Built for performance."
              title={offerings.heading}
              intro={offerings.subheading}
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {lines(offerings.body).map((item, i) => {
                const Icon = OFFERING_ICONS[i % OFFERING_ICONS.length];
                return (
                  <div key={item} className="tc-card p-6" data-testid={`offering-card-${i}`}>
                    <Icon size={26} className="text-[#10A6D8]" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold">{item}</h3>
                    <span className="mt-4 block h-px w-full bg-[#8A8F96]/25" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories?.length > 0 && (
        <section className="tc-section" data-testid="home-categories">
          <div className="tc-container">
            <SectionHeading eyebrow="Catalogue" title="Product Categories" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(0, 6).map((c) => (
                <SimpleCard
                  key={c.id}
                  to={`/products/category/${c.slug}`}
                  eyebrow={`${c.product_count} product${c.product_count === 1 ? "" : "s"}`}
                  title={c.name}
                  text={c.summary}
                  image={c.image_url}
                  testId={`home-category-${c.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured?.items?.length > 0 && (
        <section className="tc-section bg-[#EDEDED]/70" data-testid="home-featured">
          <div className="tc-container">
            <SectionHeading eyebrow="Selected Products" title="Featured from the catalogue" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Industries */}
      {industries?.length > 0 && (
        <section className="tc-section" data-testid="home-industries">
          <div className="tc-container">
            <SectionHeading eyebrow="Applications" title="Industries Served" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {industries.slice(0, 6).map((ind) => (
                <SimpleCard
                  key={ind.id}
                  to={`/industries/${ind.slug}`}
                  title={ind.name}
                  text={(ind.overview || "").slice(0, 150)}
                  image={ind.image_url}
                  testId={`home-industry-${ind.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technology */}
      {tech && (
        <section className="tc-section bg-[#003B7A] text-white" data-testid="home-technology">
          <div className="tc-container grid gap-12 lg:grid-cols-2">
            <div>
              <p className="tc-eyebrow !text-white/55">Technology</p>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{tech.heading}</h2>
              <span className="tc-rule mt-5" />
              <p className="mt-6 text-white/80">{tech.subheading}</p>
            </div>
            <div>
              <p className="text-white/80">{tech.body}</p>
              <Link
                to="/technology"
                className="mt-7 inline-flex items-center gap-2 border border-white/40 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-[#10A6D8] hover:text-[#10A6D8]"
                data-testid="home-technology-link"
              >
                Our approach <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why */}
      {why && (
        <section className="tc-section" data-testid="home-why">
          <div className="tc-container">
            <SectionHeading eyebrow="Why TrueCore" title={why.heading} intro={why.subheading} />
            <ul className="mt-12 grid gap-px border border-[#8A8F96]/30 bg-[#8A8F96]/30 sm:grid-cols-2 lg:grid-cols-4">
              {lines(why.body).map((item, i) => (
                <li key={item} className="bg-white p-6">
                  <span className="tc-mono text-xs text-[#10A6D8]">0{i + 1}</span>
                  <p className="mt-3 text-[15px] font-medium text-[#3F434A]">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-y border-[#8A8F96]/25 bg-[#EDEDED]/70" data-testid="home-cta">
        <div className="tc-container flex flex-col items-start gap-8 py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">{cta?.heading || "Discuss your requirement"}</h2>
            <p className="mt-4 text-[#3F434A]">{cta?.body}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button type="button" className="tc-btn-primary" data-testid="home-cta-quote"
              onClick={() => openEnquiry({ title: "Request a Quote" })}>
              Request a Quote
            </button>
            <WhatsAppInline testId="home-cta-whatsapp" />
          </div>
        </div>
      </section>
    </>
  );
}
