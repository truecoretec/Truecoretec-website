import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { track } from "@/lib/analytics";

const EnquiryModalContext = createContext({ openEnquiry: () => {} });

export function EnquiryModalProvider({ children }) {
  const [state, setState] = useState(null);

  const openEnquiry = useCallback((options = {}) => {
    track("request_quote_click", { source_page: options.sourcePage || window.location.pathname });
    setState({
      title: options.title || "Request a Quote",
      intro: options.intro || "Share your details and our team will respond with suitable options.",
      productSlug: options.productSlug || "",
      industrySlug: options.industrySlug || "",
      sourcePage: options.sourcePage || window.location.pathname,
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [state, close]);

  return (
    <EnquiryModalContext.Provider value={{ openEnquiry }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#003B7A]/45 p-4 sm:p-8"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="tc-reveal w-full max-w-2xl border border-[#8A8F96]/40 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={state.title}
            data-testid="enquiry-modal"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#8A8F96]/25 px-6 py-5">
              <div>
                <p className="tc-eyebrow">B2B Enquiry</p>
                <h2 className="mt-1 text-xl font-bold">{state.title}</h2>
              </div>
              <button type="button" onClick={close} aria-label="Close enquiry form"
                className="text-[#8A8F96] transition-colors hover:text-[#003B7A]" data-testid="enquiry-modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-y-auto px-6 py-6">
              <p className="mb-6 text-[15px] text-[#3F434A]">{state.intro}</p>
              <EnquiryForm
                sourcePage={state.sourcePage}
                productSlug={state.productSlug}
                industrySlug={state.industrySlug}
              />
            </div>
          </div>
        </div>
      )}
    </EnquiryModalContext.Provider>
  );
}

export const useEnquiryModal = () => useContext(EnquiryModalContext);
