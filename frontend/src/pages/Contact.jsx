import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Building2, Factory, ExternalLink, FileText } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { usePageMeta } from "@/lib/seo";
import { PageHero, Breadcrumbs, SectionHeading } from "@/components/site/Primitives";
import { WhatsAppInline } from "@/components/site/WhatsApp";
import { EnquiryForm } from "@/components/site/EnquiryForm";

const mapsLink = (coords) => `https://www.google.com/maps?q=${coords}`;
const embedLink = (coords) => `https://www.google.com/maps?q=${coords}&output=embed`;

const REGISTERED_OFFICE = {
  id: "registered-office",
  tab: "Registered Office – Lucknow",
  label: "Registered Office – Lucknow",
  title: "Registered Office",
  lines: [
    "TrueCore Technologies Pvt. Ltd.",
    "Kh-1245, Yas Puram,",
    "Raj Estate Marriage Lawn,",
    "Rajajipuram, Lucknow – 226017,",
    "Uttar Pradesh, India",
  ],
  coords: "26.829381,80.865589",
  coordsLabel: "26.829381, 80.865589",
};

const UNITS = [
  {
    id: "unit-1",
    tab: "Unit 1 – Sandila",
    label: "Manufacturing Facility – Unit 1, G-37",
    title: "Manufacturing Facility – Unit 1",
    lines: [
      "TrueCore Technologies Pvt. Ltd.",
      "Plot No. G-37",
      "Industrial Area Sandila Phase-II",
      "UPSIDA, District Hardoi",
      "Uttar Pradesh, India",
    ],
    coords: "27.106768,80.438754",
    coordsLabel: "27.106768, 80.438754",
  },
  {
    id: "unit-2",
    tab: "Unit 2 – Sandila",
    label: "Manufacturing Facility – Unit 2, G-38",
    title: "Manufacturing Facility – Unit 2",
    lines: [
      "TrueCore Technologies Pvt. Ltd.",
      "Plot No. G-38",
      "Industrial Area Sandila Phase-II",
      "UPSIDA, District Hardoi",
      "Uttar Pradesh, India",
    ],
    coords: "27.106855,80.438616",
    coordsLabel: "27.106855, 80.438616",
  },
];

const LOCATIONS = [REGISTERED_OFFICE, ...UNITS];

const MapsButton = ({ coords, testId }) => (
  <a
    href={mapsLink(coords)}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-5 inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#10A6D8] hover:text-[#003B7A]"
    data-testid={testId}
  >
    View on Google Maps <ExternalLink size={14} aria-hidden="true" />
  </a>
);

const AddressCard = ({ location, Icon, testId }) => (
  <div className="flex h-full flex-col border border-[#8A8F96]/30 bg-[#EDEDED]/50 p-6 lg:p-7" data-testid={testId}>
    <Icon size={22} className="text-[#003B7A]" aria-hidden="true" />
    <h3 className="mt-4 text-[17px] font-bold leading-snug">{location.title}</h3>
    <span className="mt-4 block h-[3px] w-10 bg-[#10A6D8]" aria-hidden="true" />
    <address className="mt-4 not-italic text-[15px] leading-relaxed text-[#3F434A]">
      {location.lines.map((line) => <span key={line} className="block">{line}</span>)}
    </address>
    <p className="tc-mono mt-4 text-[12.5px] text-[#8A8F96]">{location.coordsLabel}</p>
    <div className="mt-auto">
      <MapsButton coords={location.coords} testId={`${testId}-maps-link`} />
    </div>
  </div>
);

export default function Contact() {
  const { settings } = useSite();
  const [activeId, setActiveId] = useState(REGISTERED_OFFICE.id);
  const active = LOCATIONS.find((l) => l.id === activeId) || REGISTERED_OFFICE;

  usePageMeta({
    title: "Contact Us | TrueCore Technologies Pvt. Ltd.",
    description:
      "Contact TrueCore Technologies Pvt. Ltd. — registered office in Lucknow and manufacturing facilities under development at UPSIDA Industrial Area, Sandila Phase-II, District Hardoi.",
  });

  const rows = [
    settings?.contact_email && { Icon: Mail, label: "Primary enquiry email", value: settings.contact_email, href: `mailto:${settings.contact_email}` },
    settings?.alternate_email && { Icon: Mail, label: "Alternate corporate email", value: settings.alternate_email, href: `mailto:${settings.alternate_email}` },
    settings?.contact_phone && { Icon: Phone, label: "Phone", value: settings.contact_phone, href: `tel:${settings.contact_phone.replace(/\s/g, "")}` },
    settings?.alternate_phone && { Icon: Phone, label: "Phone", value: settings.alternate_phone, href: `tel:${settings.alternate_phone.replace(/\s/g, "")}` },
    settings?.business_hours && { Icon: Clock, label: "Business hours", value: settings.business_hours },
  ].filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact Us"
        intro="Let’s Build Better Solutions Together"
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Contact Us" }]} />

      <div className="tc-section">
        <div className="tc-container grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeading eyebrow="Company" title={settings?.company_name || "TRUECORE TECHNOLOGIES PVT. LTD."} />
            <dl className="mt-8 divide-y divide-[#8A8F96]/25 border-y border-[#8A8F96]/25" data-testid="contact-details">
              {rows.map(({ Icon, label, value, href }) => (
                <div key={value} className="flex items-start gap-4 py-4">
                  <Icon size={18} className="mt-1 text-[#10A6D8]" aria-hidden="true" />
                  <div>
                    <dt className="tc-eyebrow">{label}</dt>
                    <dd className="mt-1 text-[15px] text-[#3F434A]">
                      {href ? <a href={href} className="hover:text-[#10A6D8]">{value}</a> : value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            {rows.length === 0 && (
              <p className="mt-8 border border-dashed border-[#8A8F96]/50 bg-[#EDEDED]/50 p-5 text-[15px] text-[#3F434A]" data-testid="contact-details-pending">
                Verified contact details are pending company approval. Please use the enquiry form — every submission is
                recorded with a unique reference.
              </p>
            )}

            {settings?.cin && (
              <div className="mt-8 border border-[#8A8F96]/30 p-5" data-testid="corporate-information">
                <p className="tc-eyebrow">Corporate Information</p>
                <dl className="mt-3 space-y-2 text-[15px] text-[#3F434A]">
                  <div className="flex items-start gap-3">
                    <Building2 size={16} className="mt-1 text-[#10A6D8]" aria-hidden="true" />
                    <div>
                      <dt className="text-[12.5px] uppercase tracking-[0.08em] text-[#8A8F96]">Company name</dt>
                      <dd>{settings.company_name || "TrueCore Technologies Pvt. Ltd."}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="mt-1 text-[#10A6D8]" aria-hidden="true" />
                    <div>
                      <dt className="text-[12.5px] uppercase tracking-[0.08em] text-[#8A8F96]">CIN</dt>
                      <dd className="tc-mono text-[14px]">{settings.cin}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            )}

            <div className="mt-8">
              <WhatsAppInline testId="contact-whatsapp-button" />
            </div>
          </div>

          <div className="border border-[#8A8F96]/30 p-6 lg:p-8">
            <h2 className="text-xl font-semibold">Send an enquiry</h2>
            <p className="mt-2 text-[15px] text-[#3F434A]">Fields marked with * are required.</p>
            <div className="mt-6">
              <EnquiryForm sourcePage="/contact" />
            </div>
          </div>
        </div>

        {/* Registered office */}
        <div className="tc-container mt-20">
          <SectionHeading eyebrow="Locations" title="Registered Office" />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <AddressCard location={REGISTERED_OFFICE} Icon={Building2} testId="registered-office-card" />
          </div>
        </div>

        {/* Manufacturing facilities */}
        <div className="tc-container mt-16">
          <SectionHeading
            eyebrow="Under development"
            title="Manufacturing Facilities – Sandila"
            intro="TrueCore is developing its manufacturing infrastructure at UPSIDA Industrial Area, Sandila Phase-II, District Hardoi, Uttar Pradesh."
          />
          <div className="mt-8 grid items-stretch gap-6 md:grid-cols-2" data-testid="manufacturing-cards">
            {UNITS.map((unit, i) => (
              <AddressCard key={unit.id} location={unit} Icon={Factory} testId={`unit-${i + 1}-card`} />
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="tc-container mt-16">
          <SectionHeading eyebrow="Map" title="Our Locations" />
          <div className="mt-8 border border-[#8A8F96]/30 bg-white p-4 lg:p-5" data-testid="locations-map-section">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Select a location">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  role="tab"
                  aria-selected={loc.id === activeId}
                  onClick={() => setActiveId(loc.id)}
                  className={`whitespace-nowrap border px-4 py-2 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    loc.id === activeId
                      ? "border-[#003B7A] bg-[#003B7A] text-white"
                      : "border-[#8A8F96]/40 text-[#3F434A] hover:border-[#10A6D8] hover:text-[#10A6D8]"
                  }`}
                  data-testid={`map-tab-${loc.id}`}
                >
                  {loc.tab}
                </button>
              ))}
            </div>
            <iframe
              key={active.id}
              title={active.label}
              src={embedLink(active.coords)}
              className="mt-3 h-[300px] w-full border-0 lg:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              data-testid="locations-map-frame"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] font-medium text-[#003B7A]" data-testid="active-map-label">{active.label}</p>
              <a
                href={mapsLink(active.coords)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#10A6D8] hover:text-[#003B7A]"
                data-testid="active-map-link"
              >
                Open in Google Maps <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-[13px] text-[#8A8F96]">
            <MapPin size={14} className="mt-0.5" aria-hidden="true" />
            Coordinates are as verified by the company. Manufacturing capabilities at Sandila are under development.
          </p>
        </div>
      </div>
    </>
  );
}
