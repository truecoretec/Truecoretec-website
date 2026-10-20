import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { track } from "@/lib/analytics";

const EMPTY = {
  name: "",
  company_name: "",
  email: "",
  phone: "",
  city: "",
  enquirer_type: "",
  requirement: "",
  company_website: "",
};

export const ENQUIRER_TYPES = [
  ["customer", "Customer"],
  ["investor_analyst", "Investor or analyst"],
  ["vendor", "Vendor"],
  ["job_seeker", "Job seeker"],
];

export const EnquiryForm = ({ sourcePage, productSlug = "", industrySlug = "", onSuccess }) => {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
  }, [sourcePage]);

  const set = (key) => (e) => {
    if (!started.current) {
      started.current = true;
      track("enquiry_start", { source_page: sourcePage });
    }
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const { data } = await api.post("/enquiries", {
        name: form.name,
        company_name: form.company_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        enquirer_type: form.enquirer_type,
        requirement: form.requirement || null,
        product_slug: productSlug || null,
        industry_slug: industrySlug || null,
        source_page: sourcePage,
        company_website: form.company_website,
      });
      setReference(data.reference_number);
      setStatus("success");
      track("enquiry_submit_success", { source_page: sourcePage });
      onSuccess?.(data.reference_number);
    } catch (err) {
      setError(apiError(err, "We could not submit your enquiry. Please try again."));
      setStatus("error");
      track("enquiry_submit_error", { source_page: sourcePage });
    }
  };

  if (status === "success") {
    return (
      <div className="border-l-2 border-[#10A6D8] bg-[#EDEDED]/60 p-6" role="status" data-testid="enquiry-success">
        <CheckCircle2 size={28} className="text-[#10A6D8]" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-semibold">Enquiry received</h3>
        <p className="mt-2 text-[15px] text-[#3F434A]">
          Thank you. Your enquiry has been recorded and will be reviewed by our team.
        </p>
        <p className="tc-mono mt-4 text-[15px] text-[#003B7A]" data-testid="enquiry-reference">
          Reference: {reference}
        </p>
        <button
          type="button"
          className="tc-btn-ghost mt-6 text-[13px]"
          onClick={() => { setForm(EMPTY); setStatus("idle"); }}
          data-testid="enquiry-new-submission"
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate data-testid="enquiry-form">
      {error && (
        <div className="mb-6 flex items-start gap-3 border-l-2 border-[#DC2626] bg-[#DC2626]/5 p-4" role="alert" data-testid="enquiry-error">
          <AlertCircle size={18} className="mt-0.5 text-[#DC2626]" aria-hidden="true" />
          <p className="text-[14px] text-[#3F434A]">{error}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="eq-name" className="tc-label">Full name *</label>
          <input id="eq-name" required minLength={2} maxLength={120} value={form.name} onChange={set("name")}
            className="tc-input" autoComplete="name" data-testid="enquiry-name-input" />
        </div>
        <div>
          <label htmlFor="eq-company" className="tc-label">Company name *</label>
          <input id="eq-company" required minLength={2} maxLength={180} value={form.company_name} onChange={set("company_name")}
            className="tc-input" autoComplete="organization" data-testid="enquiry-company-input" />
        </div>
        <div>
          <label htmlFor="eq-email" className="tc-label">Email *</label>
          <input id="eq-email" type="email" required maxLength={254} value={form.email} onChange={set("email")}
            className="tc-input" autoComplete="email" data-testid="enquiry-email-input" />
        </div>
        <div>
          <label htmlFor="eq-phone" className="tc-label">Phone number *</label>
          <input id="eq-phone" required minLength={7} maxLength={20} value={form.phone} onChange={set("phone")}
            className="tc-input" placeholder="+91 98765 43210" autoComplete="tel" data-testid="enquiry-phone-input" />
        </div>
        <div>
          <label htmlFor="eq-city" className="tc-label">City name *</label>
          <input id="eq-city" required minLength={2} maxLength={120} value={form.city} onChange={set("city")}
            className="tc-input" autoComplete="address-level2" data-testid="enquiry-city-input" />
        </div>
        <div>
          <label htmlFor="eq-type" className="tc-label">Select who you are *</label>
          <select id="eq-type" required value={form.enquirer_type} onChange={set("enquirer_type")}
            className="tc-input" data-testid="enquiry-type-select">
            <option value="">Select an option</option>
            {ENQUIRER_TYPES.map(([value, label]) => (
              <option key={value} value={value} label={label} />
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="eq-requirement" className="tc-label">Application or technical requirement (optional)</label>
          <textarea id="eq-requirement" maxLength={5000} rows={4} value={form.requirement}
            onChange={set("requirement")} className="tc-input"
            placeholder="Describe the application, operating conditions, loads, dimensions or drawing reference."
            data-testid="enquiry-requirement-input" />
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="eq-website">Website</label>
        <input id="eq-website" tabIndex={-1} value={form.company_website} onChange={set("company_website")} autoComplete="off" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" className="tc-btn-primary" disabled={status === "loading"} data-testid="enquiry-submit-button">
          {status === "loading" && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {status === "loading" ? "Submitting" : "Submit Enquiry"}
        </button>
        <p className="text-[13px] text-[#8A8F96]">
          By submitting you agree to our <Link to="/privacy-policy" className="text-[#10A6D8] hover:underline">privacy policy</Link>.
        </p>
      </div>
    </form>
  );
};
