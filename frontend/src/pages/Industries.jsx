import useSWR from "swr";
import { Link } from "react-router-dom";
import { ArrowRight, TrainFront, Car, Factory, TramFront, Cog } from "lucide-react";
import { api } from "@/lib/api";
import { usePageMeta } from "@/lib/seo";
import { PageHero, Breadcrumbs } from "@/components/site/Primitives";
import { SimpleCard } from "@/components/site/Cards";
import { useEnquiryModal } from "@/components/site/EnquiryModal";

const fetcher = (url) => api.get(url).then((r) => r.data);
const find = (page, key) => page?.sections?.find((s) => s.key === key);

const ICONS = { train: TrainFront, car: Car, factory: Factory, metro: TramFront, gear: Cog };
const ACCENT = { train: "blue", car: "cyan", factory: "blue", metro: "cyan", gear: "blue" };

const CARD_KEYS = ["card_railways", "card_automotive", "card_industrial", "card_mobility", "card_custom"];
const DETAILS = [
  { key: "detail_railways", cta: "Explore Railway Solutions" },
  { key: "detail_automotive", cta: "Explore Automotive Solutions" },
  { key: "detail_industrial", cta: "Explore Industrial Solutions" },
  { key: "detail_mobility", cta: "Explore Mobility Solutions" },
  { key: "detail_custom", cta: "Discuss Your Application" },
];
const PROCESS = ["Application Requirement", "Material Selection", "Product Engineering", "Tooling",
  "Prototype", "Validation", "Production"];

const anchorId = (key) => key.replace("detail_", "industry-");

const splitBody = (body) =>
  (body || "").split("\n\n").map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const bullets = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
    const text = lines.filter((l) => !l.startsWith("- ")).join(" ");
    return { text, bullets };
  });

const IndustryCard = ({ section, index }) => {
  const Icon = ICONS[section.subheading] || Cog;
  const cyan = ACCENT[section.subheading] === "cyan";
  return (
    <article
      className="group relative flex h-full flex-col rounded-sm border border-[#8A8F96]/30 bg-white transition-all duration-300 hover:border-[#10A6D8] hover:shadow-[0_14px_30px_-20px_rgba(0,59,122,0.5)]"      data-testid={`industry-card-${index}`}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-t-sm bg-[#EDEDED]">
        <img
          src={section.image_url}
          alt={section.heading}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <span
        className={`relative z-10 ml-6 flex h-12 w-12 -mt-6 items-center justify-center rounded-full text-white shadow-md ${
          cyan ? "bg-[#10A6D8]" : "bg-[#003B7A]"
        }`}
        aria-hidden="true"
      >
        <Icon size={22} />
      </span>
      <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
        <h3 className="text-lg font-bold leading-snug">{section.heading}</h3>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#3F434A]">{section.body}</p>
        <a
          href={`#${anchorId(CARD_KEYS[index - 1].replace("card_", "detail_"))}`}
          className="mt-auto inline-flex items-center gap-2 pt-5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#10A6D8] hover:text-[#003B7A]"
          data-testid={`industry-card-link-${index}`}
        >
          Explore Solutions <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
};

const DetailSection = ({ section, cta, index, onEnquire }) => {
  const blocks = splitBody(section.body);
  const flip = index % 2 === 1;
  return (
    <section
      id={anchorId(section.key)}
      className="scroll-mt-24 border-t border-[#8A8F96]/20 pt-14 lg:pt-20"
      data-testid={`industry-detail-${index + 1}`}
    >
      <div className={`grid items-start gap-10 lg:grid-cols-2 lg:gap-14 ${flip ? "" : ""}`}>
        <figure className={`overflow-hidden rounded-sm border border-[#8A8F96]/30 bg-[#EDEDED] ${flip ? "lg:order-2" : ""}`}>
          <img src={section.image_url} alt={section.subheading} loading="lazy"
            className="aspect-[4/3] w-full object-cover" />
        </figure>
        <div className={flip ? "lg:order-1" : ""}>
          <p className="tc-eyebrow">{section.subheading}</p>
          <h3 className="mt-3 text-2xl font-bold leading-snug lg:text-3xl">{section.heading}</h3>
          <span className="tc-rule mt-5" />
          <div className="mt-6 space-y-5">
            {blocks.map((block) => (
              <div key={block.text || block.bullets[0]}>
                {block.text && <p className="text-[#3F434A]">{block.text}</p>}
                {block.bullets.length > 0 && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {block.bullets.map((b) => (
                      <li key={b} className="flex gap-2.5 text-[14.5px] text-[#3F434A]">
                        <span className="mt-2.5 h-[3px] w-3 shrink-0 bg-[#10A6D8]" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {section.key === "detail_custom" && (
            <ol className="mt-7 flex flex-wrap items-center gap-2" data-testid="custom-process-flow">
              {PROCESS.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="border border-[#8A8F96]/40 bg-white px-3 py-1.5 text-[12px] font-medium text-[#003B7A]">
                    {step}
                  </span>
                  {i < PROCESS.length - 1 && <ArrowRight size={13} className="text-[#10A6D8]" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          )}

          <button
            type="button"
            onClick={() => onEnquire(section.subheading)}
            className="tc-btn-ghost mt-7 text-[13px]"
            data-testid={`industry-detail-cta-${index + 1}`}
          >
            {cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default function Industries() {
  const { data: page } = useSWR("/pages/industries", fetcher, { revalidateOnFocus: false });
  const { data: published } = useSWR("/industries", fetcher, { revalidateOnFocus: false });
  const { openEnquiry } = useEnquiryModal();

  usePageMeta({
    title: page?.seo_title || "Industries We Cater | TrueCore Technologies",
    description: page?.seo_description,
  });

  const intro = find(page, "intro");
  const solutions = find(page, "solutions_intro");
  const cross = find(page, "cross");
  const cards = CARD_KEYS.map((key) => find(page, key)).filter(Boolean);

  const enquire = (industry) =>
    openEnquiry({
      title: `${industry} Enquiry`,
      intro: `Tell us about your ${industry.toLowerCase()} application and our team will respond with suitable engineered polymer options.`,
    });

  return (
    <>
      <section className="tc-grid-bg border-b border-[#8A8F96]/20 bg-white">
        <div className="tc-container grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:py-20">
          <div className="tc-reveal">
            <p className="tc-eyebrow">Industries We Cater</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {intro?.heading || "Engineered Polymer Solutions Across Critical Industries"}
            </h1>
          </div>
          <div className="tc-reveal" style={{ animationDelay: "100ms" }}>
            <p className="text-[#3F434A]">{intro?.body}</p>
            <span className="tc-rule mt-6" />
          </div>
        </div>
      </section>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Industries We Cater" }]} />

      <div className="tc-section">
        <div className="tc-container">
          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" data-testid="industry-cards">
            {cards.map((section, i) => <IndustryCard key={section.key} section={section} index={i + 1} />)}
          </div>

          {solutions && (
            <div className="mt-20 max-w-3xl" data-testid="industries-solutions-intro">
              <h2 className="text-2xl font-bold sm:text-3xl">{solutions.heading}</h2>
              <span className="tc-rule mt-5" />
              <p className="mt-6 text-[#3F434A]">{solutions.body}</p>
            </div>
          )}

          <div className="mt-14 space-y-14 lg:space-y-20">
            {DETAILS.map((item, i) => {
              const section = find(page, item.key);
              return section ? (
                <DetailSection key={item.key} section={section} cta={item.cta} index={i} onEnquire={enquire} />
              ) : null;
            })}
          </div>

          {published?.length > 0 && (
            <div className="mt-20" data-testid="published-industry-pages">
              <h2 className="text-2xl font-bold sm:text-3xl">Industry pages</h2>
              <span className="tc-rule mt-5" />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {published.map((ind) => (
                  <SimpleCard
                    key={ind.id}
                    to={`/industries/${ind.slug}`}
                    title={ind.name}
                    text={(ind.overview || "").slice(0, 170)}
                    image={ind.image_url}
                    testId={`industry-page-card-${ind.slug}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {cross && (
        <section className="bg-[#003B7A] py-16 text-white lg:py-20" data-testid="industries-cross-section">
          <div className="tc-container">
            <h2 className="max-w-3xl text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{cross.heading}</h2>
            <span className="tc-rule mt-6" />
            <p className="mt-6 max-w-3xl text-white/80">{cross.body}</p>
            <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-white/75">
              {(cross.subheading || "").split("|").map((item) => item.trim()).filter(Boolean).map((item) => (
                <li key={item} className="border border-white/25 px-3 py-1.5">{item}</li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#003B7A] transition-colors hover:bg-[#10A6D8] hover:text-white"
                data-testid="industries-explore-products"
              >
                Explore Our Products <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => openEnquiry({ title: "Request a Technical Discussion" })}
                className="inline-flex items-center gap-2 border border-white/45 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-[#10A6D8] hover:text-[#10A6D8]"
                data-testid="industries-technical-discussion"
              >
                Request a Technical Discussion
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
