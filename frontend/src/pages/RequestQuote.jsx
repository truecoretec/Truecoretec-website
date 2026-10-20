import { usePageMeta } from "@/lib/seo";
import { PageHero, Breadcrumbs } from "@/components/site/Primitives";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { WhatsAppInline } from "@/components/site/WhatsApp";

export default function RequestQuote() {
  usePageMeta({
    title: "Request a Quote | TrueCore Technologies Pvt. Ltd.",
    description: "Request a quotation for engineered polymer components, advanced polymer products or a custom material solution.",
  });

  return (
    <>
      <PageHero
        eyebrow="B2B Enquiry"
        title="Request a Quote"
        intro="Tell us about the application. Every submission is stored with a unique reference number and reviewed by our team."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Request a Quote" }]} />

      <div className="tc-section">
        <div className="tc-container grid gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="border border-[#8A8F96]/30 p-6 lg:p-8">
            <EnquiryForm sourcePage="/request-quote" />
          </div>
          <aside className="space-y-8">
            <div className="border-l-2 border-[#10A6D8] bg-[#EDEDED]/60 p-6">
              <p className="tc-eyebrow">What happens next</p>
              <ol className="mt-4 space-y-3 text-[15px] text-[#3F434A]">
                <li>1. Your enquiry is saved with a unique reference.</li>
                <li>2. Our team reviews the application requirement.</li>
                <li>3. We respond with product suitability or a custom proposal.</li>
              </ol>
            </div>
            <div className="border border-[#8A8F96]/30 p-6">
              <p className="tc-eyebrow">Prefer to chat?</p>
              <p className="mt-3 text-[15px] text-[#3F434A]">
                Message us on WhatsApp with your requirement summary.
              </p>
              <div className="mt-5">
                <WhatsAppInline testId="quote-whatsapp-button" />
              </div>
            </div>
            <p className="text-[13px] text-[#8A8F96]">
              We collect only the details needed to respond to your enquiry. See our privacy policy for retention
              information. Prices, availability and delivery timelines are confirmed only after review.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
