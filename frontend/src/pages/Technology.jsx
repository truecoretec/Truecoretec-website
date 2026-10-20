import useSWR from "swr";
import { api } from "@/lib/api";
import { usePageMeta } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/Primitives";
import { useEnquiryModal } from "@/components/site/EnquiryModal";

const fetcher = (url) => api.get(url).then((r) => r.data);
const find = (page, key) => page?.sections?.find((s) => s.key === key);

const UnitCard = ({ section, index }) => (
  <article className="tc-card flex flex-col overflow-hidden rounded-sm" data-testid={`technology-unit-${index}`}>
    {section.image_url && (
      <div className="aspect-[16/10] overflow-hidden bg-[#EDEDED]">
        <img
          src={section.image_url}
          alt={section.heading}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
        />
      </div>
    )}
    <div className="flex flex-1 flex-col p-6 lg:p-8">
      <p className="tc-eyebrow">Unit {index}</p>
      <h3 className="mt-2 text-xl font-bold leading-snug lg:text-2xl">{section.heading}</h3>
      <span className="tc-rule mt-5" />
      <p className="mt-5 text-[#3F434A]">{section.body}</p>
      {section.subheading && (
        <div className="mt-6 border-t border-[#8A8F96]/25 pt-5">
          <p className="tc-eyebrow">Applications</p>
          <p className="mt-2 text-[15px] text-[#3F434A]">{section.subheading}</p>
        </div>
      )}
    </div>
  </article>
);

export default function Technology() {
  const { data: page } = useSWR("/pages/technology", fetcher, { revalidateOnFocus: false });
  const { openEnquiry } = useEnquiryModal();

  usePageMeta({
    title: page?.seo_title || "Technology & Manufacturing | TrueCore Technologies",
    description: page?.seo_description,
  });

  const intro = find(page, "intro");
  const unit1 = find(page, "unit_1");
  const unit2 = find(page, "unit_2");
  const integrated = find(page, "integrated");
  const closing = find(page, "closing");

  return (
    <>
      <section className="tc-grid-bg border-b border-[#8A8F96]/20 bg-white">
        <div className="tc-container py-14 lg:py-20">
          <div className="tc-reveal max-w-3xl">
            <p className="tc-eyebrow">Engineering</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {intro?.heading || "Technology & Manufacturing"}
            </h1>
            <span className="tc-rule mt-6" />
            <h2 className="mt-6 text-base font-semibold text-[#003B7A] md:text-lg">{intro?.subheading}</h2>
            <p className="mt-4 text-[#3F434A]">{intro?.body}</p>
          </div>
        </div>
      </section>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: page?.title || "Technology" }]} />

      <div className="tc-section">
        <div className="tc-container">
          <div className="grid gap-8 lg:grid-cols-2" data-testid="technology-units">
            {unit1 && <UnitCard section={unit1} index={1} />}
            {unit2 && <UnitCard section={unit2} index={2} />}
          </div>

          {integrated && (
            <section className="mt-16 border-l-2 border-[#10A6D8] bg-[#EDEDED]/60 p-7 lg:mt-20 lg:p-10" data-testid="technology-integrated">
              <h2 className="text-xl font-bold lg:text-2xl">{integrated.heading}</h2>
              <p className="mt-4 max-w-4xl text-[#3F434A]">{integrated.body}</p>
            </section>
          )}

          {closing?.body && (
            <p className="mt-14 max-w-3xl text-xl font-semibold leading-snug text-[#003B7A] lg:text-2xl" data-testid="technology-closing">
              “{closing.body}”
            </p>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-[#8A8F96]/25 pt-10">
            <p className="text-[#3F434A]">
              Manufacturing capabilities are under development. Share your application requirement and our team will
              advise on suitability and timelines.
            </p>
            <button
              type="button"
              className="tc-btn-primary"
              onClick={() => openEnquiry({ title: "Discuss a Requirement" })}
              data-testid="technology-enquire-cta"
            >
              Discuss a Requirement
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
