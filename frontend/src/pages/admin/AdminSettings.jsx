import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { AdminHeading, Field } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function AdminSettings() {
  const { data, mutate } = useSWR("/admin/settings", fetcher);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm({ ...data, social_links: data.social_links || {} });
  }, [data]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    ["id", "updated_at"].forEach((k) => delete payload[k]);
    try {
      await api.patch("/admin/settings", payload);
      toast.success("Settings saved — public pages now use these details");
      mutate();
    } catch (err) { toast.error(apiError(err)); } finally { setSaving(false); }
  };

  if (!form) return <p className="text-[#8A8F96]">Loading settings…</p>;

  return (
    <>
      <AdminHeading title="Site Settings" subtitle="Single source of truth for company details used across the header, footer, forms and contact page." />

      <form onSubmit={save} className="max-w-4xl space-y-8" data-testid="settings-form">
        <fieldset className="border border-[#8A8F96]/30 bg-white p-5">
          <legend className="tc-eyebrow px-1">Identity</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name"><input value={form.company_name || ""} onChange={(e) => set("company_name", e.target.value)} className="tc-input" data-testid="settings-company-name" /></Field>
            <Field label="Tagline"><input value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} className="tc-input" /></Field>
            <Field label="Positioning"><input value={form.positioning || ""} onChange={(e) => set("positioning", e.target.value)} className="tc-input" /></Field>
            <Field label="Logo URL"><input value={form.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} className="tc-input" placeholder="https://" /></Field>
          </div>
        </fieldset>

        <fieldset className="border border-[#8A8F96]/30 bg-white p-5">
          <legend className="tc-eyebrow px-1">Contact</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact email"><input type="email" value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} className="tc-input" data-testid="settings-contact-email" /></Field>
            <Field label="Alternate email"><input type="email" value={form.alternate_email || ""} onChange={(e) => set("alternate_email", e.target.value)} className="tc-input" data-testid="settings-alternate-email" /></Field>
            <Field label="Contact phone"><input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} className="tc-input" data-testid="settings-contact-phone" /></Field>
            <Field label="Alternate phone"><input value={form.alternate_phone || ""} onChange={(e) => set("alternate_phone", e.target.value)} className="tc-input" data-testid="settings-alternate-phone" /></Field>
            <Field label="CIN"><input value={form.cin || ""} onChange={(e) => set("cin", e.target.value)} className="tc-input" data-testid="settings-cin" /></Field>
            <Field label="WhatsApp number" hint="International format, digits only e.g. 919876543210">
              <input value={form.whatsapp_number || ""} onChange={(e) => set("whatsapp_number", e.target.value)} className="tc-input" data-testid="settings-whatsapp-number" />
            </Field>
            <Field label="Business hours"><input value={form.business_hours || ""} onChange={(e) => set("business_hours", e.target.value)} className="tc-input" /></Field>
            <Field label="Address"><textarea rows={2} value={form.address || ""} onChange={(e) => set("address", e.target.value)} className="tc-input" /></Field>
            <Field label="Default WhatsApp message"><textarea rows={3} value={form.whatsapp_message || ""} onChange={(e) => set("whatsapp_message", e.target.value)} className="tc-input" /></Field>
            <Field label="Map embed URL" hint="Only add once the location is confirmed">
              <input value={form.map_embed_url || ""} onChange={(e) => set("map_embed_url", e.target.value)} className="tc-input" />
            </Field>
            <Field label="Enquiry notification recipients" hint="Comma separated. Used when an email provider is configured.">
              <input value={form.enquiry_recipients || ""} onChange={(e) => set("enquiry_recipients", e.target.value)} className="tc-input" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="border border-[#8A8F96]/30 bg-white p-5">
          <legend className="tc-eyebrow px-1">Social</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {["linkedin", "twitter", "youtube"].map((k) => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                <input value={form.social_links?.[k] || ""} className="tc-input"
                  onChange={(e) => set("social_links", { ...form.social_links, [k]: e.target.value })} />
              </Field>
            ))}
          </div>
        </fieldset>

        <fieldset className="border border-[#8A8F96]/30 bg-white p-5">
          <legend className="tc-eyebrow px-1">SEO & analytics</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default SEO title"><input value={form.default_seo_title || ""} onChange={(e) => set("default_seo_title", e.target.value)} className="tc-input" /></Field>
            <Field label="Default SEO description"><input value={form.default_seo_description || ""} onChange={(e) => set("default_seo_description", e.target.value)} className="tc-input" /></Field>
            <Field label="Analytics measurement ID" hint="Public ID only. Never store secret credentials here.">
              <input value={form.analytics_id || ""} onChange={(e) => set("analytics_id", e.target.value)} className="tc-input" />
            </Field>
            <Field label="Approval note (internal)"><input value={form.pending_approval_note || ""} onChange={(e) => set("pending_approval_note", e.target.value)} className="tc-input" /></Field>
          </div>
        </fieldset>

        <button type="submit" className="tc-btn-primary" disabled={saving} data-testid="settings-save-button">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </>
  );
}
