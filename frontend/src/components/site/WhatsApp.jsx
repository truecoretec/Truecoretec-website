import { MessageCircle } from "lucide-react";
import { useSite, whatsappLink } from "@/context/SiteContext";
import { track } from "@/lib/analytics";

export const WhatsAppFloat = () => {
  const { settings } = useSite();
  const href = whatsappLink(settings);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { placement: "floating" })}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 bg-[#003B7A] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#10A6D8]"
      data-testid="whatsapp-float-button"
    >
      <MessageCircle size={18} aria-hidden="true" />
      <span className="hidden sm:inline">WhatsApp Enquiry</span>
    </a>
  );
};

export const WhatsAppInline = ({ context, testId = "whatsapp-inline-button" }) => {
  const { settings } = useSite();
  const href = whatsappLink(settings, context);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { placement: "inline" })}
      className="tc-btn-outline"
      data-testid={testId}
    >
      <MessageCircle size={16} aria-hidden="true" /> WhatsApp Us
    </a>
  );
};
