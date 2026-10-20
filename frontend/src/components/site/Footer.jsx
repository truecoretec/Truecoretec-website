import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useSite } from "@/context/SiteContext";

const EXPLORE = [
  ["/", "Home"],
  ["/about", "About Us"],
  ["/products", "Products"],
  ["/industries", "Industries We Cater"],
  ["/technology", "Technology & Manufacturing"],
  ["/sustainability", "Sustainability"],
  ["/directors", "Leadership & Team"],
  ["/contact", "Contact Us"],
];

const CONNECT = [
  "Request an RFQ",
  "Product Enquiry",
  "Vendor / Supplier Enquiry",
  "Research Collaboration",
  "Careers",
];

const LOCATIONS = [
  ["Lucknow – Registered Office", "https://www.google.com/maps?q=26.829381,80.865589"],
  ["Sandila – Unit 1 (G-37)", "https://www.google.com/maps?q=27.106768,80.438754"],
  ["Sandila – Unit 2 (G-38)", "https://www.google.com/maps?q=27.106855,80.438616"],
];

const INDUSTRIES = ["Railways", "Automotive & EV", "Mobility & Metro", "Industrial", "Custom Engineering"];

const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

export const Footer = () => {
  const { settings } = useSite();
  const emails = ["enquiry@truecoretec.com", "truecoretec@gmail.com"];
  const phones = ["+91 63948 12646", "+91 76199 32431"];

  return (
    <footer className="mt-auto bg-[#003B7A] text-white/80" data-testid="site-footer">
      <div className="tc-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        <div>
          <Link to="/" className="flex items-center gap-2.5" data-testid="footer-logo-link">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="TrueCore Technologies" className="h-9 w-auto" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center bg-white text-sm font-extrabold text-[#003B7A]">
                TC
              </span>
            )}
            <span className="text-[15px] font-extrabold tracking-tight text-white">
              TRUECORE<span className="text-[#10A6D8]">.</span>
            </span>
          </Link>
          <p className="mt-4 text-[14px] font-semibold text-white">TrueCore Technologies Pvt. Ltd.</p>
          <p className="mt-1 text-[13px] text-[#10A6D8]">Advanced Materials. A Stronger Tomorrow.</p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/65">
            High-performance polyurethane, TPU and engineered polymer solutions for railway, automotive,
            mobility and industrial applications.
          </p>
          <p className="mt-4 text-[12px] text-white/55" data-testid="footer-cin">
            CIN: <span className="tc-mono">U20131UP2026PTC251661</span>
          </p>
        </div>

        <div>
          <p className="tc-eyebrow !text-white/55">Explore</p>
          <ul className="mt-4 space-y-2 text-[13.5px]">
            {EXPLORE.map(([to, label]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="transition-colors hover:text-[#10A6D8]"
                  data-testid={`footer-explore-${slug(label)}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="tc-eyebrow !text-white/55">Connect</p>
          <ul className="mt-4 space-y-2 text-[13.5px]">
            {CONNECT.map((label) => (
              <li key={label}>
                <Link
                  to="/contact"
                  className="transition-colors hover:text-[#10A6D8]"
                  data-testid={`footer-connect-${slug(label)}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="tc-eyebrow !text-white/55">Contact Us</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            {emails.map((email, i) => (
              <li key={email} className="flex items-start gap-2">
                <Mail size={15} className="mt-[3px] shrink-0 text-[#10A6D8]" aria-hidden="true" />
                <a
                  href={`mailto:${email}`}
                  className="break-all transition-colors hover:text-[#10A6D8]"
                  data-testid={`footer-email-${i + 1}`}
                >
                  {email}
                </a>
              </li>
            ))}
            {phones.map((phone, i) => (
              <li key={phone} className="flex items-start gap-2">
                <Phone size={15} className="mt-[3px] shrink-0 text-[#10A6D8]" aria-hidden="true" />
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-[#10A6D8]"
                  data-testid={`footer-phone-${i + 1}`}
                >
                  {phone}
                </a>
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-1.5 border border-[#10A6D8]/60 px-3.5 py-2 text-[13px] font-semibold text-[#10A6D8] transition-colors hover:bg-[#10A6D8] hover:text-white"
            data-testid="footer-send-enquiry"
          >
            Send an Enquiry
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="tc-container flex flex-col gap-2 py-4 text-[13px] sm:flex-row sm:items-center sm:gap-4">
          <span className="tc-eyebrow !text-white/55 flex items-center gap-1.5">
            <MapPin size={14} className="text-[#10A6D8]" aria-hidden="true" />
            Our Locations
          </span>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
            {LOCATIONS.map(([label, href], i) => (
              <span key={label} className="flex items-center gap-3">
                {i > 0 && <span className="hidden text-white/25 sm:inline">|</span>}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/75 transition-colors hover:text-[#10A6D8]"
                  data-testid={`footer-location-${i + 1}`}
                >
                  {label}
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="tc-container py-3 text-[12.5px] text-white/55" data-testid="footer-industry-strip">
          {INDUSTRIES.join("  |  ")}
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="tc-container flex flex-col gap-2 py-4 text-[12.5px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TrueCore Technologies Pvt. Ltd. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacy-policy" className="transition-colors hover:text-[#10A6D8]">Privacy Policy</Link>
            <Link to="/admin/login" className="transition-colors hover:text-[#10A6D8]" data-testid="footer-admin-link">Staff Login</Link>
            <span className="text-white/70">Advanced Materials. A Stronger Tomorrow.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
