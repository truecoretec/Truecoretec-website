import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export const SectionHeading = ({ eyebrow, title, intro, align = "left", as: Tag = "h2" }) => (
  <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
    {eyebrow && <p className="tc-eyebrow">{eyebrow}</p>}
    <Tag className="mt-3 text-2xl font-bold sm:text-3xl lg:text-4xl">{title}</Tag>
    <span className={`tc-rule mt-5 ${align === "center" ? "mx-auto" : ""}`} />
    {intro && <p className="mt-5 text-[#3F434A]">{intro}</p>}
  </div>
);

export const Breadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb" className="border-b border-[#8A8F96]/20 bg-[#EDEDED]/60">
    <ol className="tc-container flex flex-wrap items-center gap-1.5 py-3 text-[13px] text-[#8A8F96]">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={13} aria-hidden="true" />}
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className="hover:text-[#10A6D8]">{item.label}</Link>
          ) : (
            <span className="text-[#3F434A]" aria-current="page">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export const PageHero = ({ eyebrow, title, intro }) => (
  <section className="tc-grid-bg border-b border-[#8A8F96]/20 bg-white">
    <div className="tc-container py-14 lg:py-20">
      <div className="tc-reveal max-w-3xl">
        {eyebrow && <p className="tc-eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <span className="tc-rule mt-6" />
        {intro && <p className="mt-6 text-lg text-[#3F434A]">{intro}</p>}
      </div>
    </div>
  </section>
);

export const EmptyState = ({ title, message, action, testId }) => (
  <div className="border border-dashed border-[#8A8F96]/50 bg-[#EDEDED]/40 px-6 py-14 text-center" data-testid={testId}>
    <p className="text-lg font-semibold text-[#003B7A]">{title}</p>
    {message && <p className="mx-auto mt-2 max-w-xl text-[15px] text-[#3F434A]">{message}</p>}
    {action && <div className="mt-6 flex justify-center">{action}</div>}
  </div>
);

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-[#EDEDED] ${className}`} aria-hidden="true" />
);
