import { useEffect, useState } from "react";
import useSWR from "swr";
import { ArrowRight, X, Linkedin, Cpu, Factory, ShieldCheck, Handshake } from "lucide-react";
import { api } from "@/lib/api";
import { usePageMeta } from "@/lib/seo";
import { PageHero, Breadcrumbs, EmptyState } from "@/components/site/Primitives";
import { useEnquiryModal } from "@/components/site/EnquiryModal";

const fetcher = (url) => api.get(url).then((r) => r.data);

const SUPPORTING_TEXT =
  "TrueCore Technologies is guided by leadership combining strategy, sustainability, railway " +
  "experience, financial discipline and institutional understanding.";

const TEAM = [
  { Icon: Cpu, title: "Engineering & Product Development",
    text: "Application assessment, material selection and product engineering for customer-specific components." },
  { Icon: Factory, title: "Manufacturing & Operations",
    text: "Processing discipline, tooling coordination and production planning as capabilities are developed." },
  { Icon: ShieldCheck, title: "Quality & Technical Assurance",
    text: "Inspection planning, documentation and conformance against applicable drawings and specifications." },
  { Icon: Handshake, title: "Commercial & Business Development",
    text: "Enquiry handling, technical-commercial evaluation and long-term customer partnerships." },
];

const Portrait = ({ director, size = "h-[120px] w-[120px]" }) => (
  <div className={`${size} shrink-0 overflow-hidden rounded-full border border-[#8A8F96]/30 bg-[#EDEDED]`}>
    {director.photo_url ? (
      <img src={director.photo_url} alt={director.name} loading="lazy" className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#8A8F96]">
        {director.name.slice(0, 1)}
      </div>
    )}
  </div>
);

const ProfileModal = ({ director, onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#003B7A]/45 px-0 py-6 sm:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="tc-reveal relative mx-auto w-[94%] max-w-[720px] border border-[#8A8F96]/40 bg-white shadow-xl sm:w-full"
        role="dialog"
        aria-modal="true"
        aria-label={director.name}
        data-testid="director-profile-modal"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="absolute right-4 top-4 text-[#8A8F96] transition-colors hover:text-[#003B7A]"
          data-testid="director-modal-close"
        >
          <X size={20} />
        </button>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-8 sm:px-9">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Portrait director={director} size="h-[96px] w-[96px]" />
            <div className="pr-8">
              <h2 className="text-xl font-bold leading-snug sm:text-2xl">{director.name}</h2>
              <p className="mt-2 text-[12.5px] font-semibold uppercase leading-snug tracking-[0.06em] text-[#10A6D8]">
                {director.designation}
              </p>
            </div>
          </div>
          <span className="tc-rule mt-6" />
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#3F434A]">
            {(director.bio || "").split("\n").map((p) => p.trim()).filter(Boolean).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          {director.linkedin_url && (
            <a href={director.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#10A6D8] hover:text-[#003B7A]">
              <Linkedin size={15} aria-hidden="true" /> LinkedIn profile
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const DirectorCard = ({ director, onOpen }) => (
  <article
    className="flex h-full flex-col items-start border border-[#8A8F96]/30 bg-white p-6 transition-all duration-300 hover:border-[#10A6D8] hover:shadow-[0_12px_26px_-18px_rgba(0,59,122,0.45)] lg:p-7"
    data-testid={`director-card-${director.id}`}
  >
    <Portrait director={director} />
    <span className="mt-5 block h-[3px] w-10 bg-[#10A6D8]" aria-hidden="true" />
    <h2 className="mt-5 text-lg font-bold leading-snug">{director.name}</h2>
    <p className="mt-2 min-h-[3.25rem] text-[12px] font-semibold uppercase leading-snug tracking-[0.06em] text-[#10A6D8]">
      {director.designation}
    </p>
    <p className="mt-4 text-[14.5px] leading-relaxed text-[#3F434A]">
      {director.short_intro || (director.bio || "").split("\n")[0]}
    </p>
    <button
      type="button"
      onClick={() => onOpen(director)}
      className="mt-auto inline-flex items-center gap-2 pt-6 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#003B7A] hover:text-[#10A6D8]"
      data-testid={`director-view-profile-${director.id}`}
    >
      View Profile <ArrowRight size={14} aria-hidden="true" />
    </button>
  </article>
);

export default function Directors() {
  const { data } = useSWR("/directors", fetcher, { revalidateOnFocus: false });
  const { openEnquiry } = useEnquiryModal();
  const [active, setActive] = useState(null);

  usePageMeta({ title: "Board of Directors | TrueCore Technologies Pvt. Ltd.", description: SUPPORTING_TEXT });

  return (
    <>
      <PageHero eyebrow="Leadership" title="Board of Directors" intro={SUPPORTING_TEXT} />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Board of Directors" }]} />

      <div className="tc-section">
        <div className="tc-container">
          {data?.length ? (
            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8" data-testid="directors-grid">
              {data.map((d) => <DirectorCard key={d.id} director={d} onOpen={setActive} />)}
            </div>
          ) : (
            <EmptyState
              testId="directors-empty-state"
              title="Leadership details are being finalised"
              message="Director profiles will be published once approved."
              action={
                <button type="button" className="tc-btn-primary" data-testid="directors-enquire-cta"
                  onClick={() => openEnquiry({ title: "Contact the Company" })}>
                  Contact the Company
                </button>
              }
            />
          )}

          <section className="mt-20" data-testid="our-team-section">
            <p className="tc-eyebrow">Our Team</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Functional capabilities</h2>
            <span className="tc-rule mt-5" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map(({ Icon, title, text }) => (
                <div key={title} className="flex h-full flex-col border border-[#8A8F96]/30 bg-white p-6 transition-colors duration-300 hover:border-[#10A6D8]">
                  <Icon size={24} className="text-[#10A6D8]" aria-hidden="true" />
                  <h3 className="mt-5 text-[15.5px] font-semibold leading-snug">{title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#3F434A]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="mt-16 text-xl font-semibold text-[#003B7A] lg:text-2xl" data-testid="team-closing-line">
            One Team. One Engineering Vision.
          </p>
        </div>
      </div>

      {active && <ProfileModal director={active} onClose={() => setActive(null)} />}
    </>
  );
}
