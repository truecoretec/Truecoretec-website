import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminHeading, Field, StatusBadge } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function AdminContent() {
  const { data: pages, mutate } = useSWR("/admin/content", fetcher);
  const [slug, setSlug] = useState("");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug && pages?.length) setSlug(pages[0].slug);
  }, [pages, slug]);

  useEffect(() => {
    const page = pages?.find((p) => p.slug === slug);
    if (page) setDraft(JSON.parse(JSON.stringify(page)));
  }, [slug, pages]);

  const setSection = (i, key, value) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s, j) => (j === i ? { ...s, [key]: value } : s)) }));

  const save = async (status) => {
    setSaving(true);
    try {
      await api.patch(`/admin/content/${draft.slug}`, {
        title: draft.title,
        seo_title: draft.seo_title,
        seo_description: draft.seo_description,
        status: status || draft.status,
        sections: draft.sections.map(({ key, heading, subheading, body, image_url }) => ({
          key, heading: heading || "", subheading: subheading || "", body: body || "", image_url: image_url || "",
        })),
      });
      toast.success(status === "published" ? "Page published" : "Page saved");
      mutate();
    } catch (err) { toast.error(apiError(err)); } finally { setSaving(false); }
  };

  if (!pages) return <p className="text-[#8A8F96]">Loading content…</p>;

  const publicPath = draft?.slug === "home" ? "/" : `/${draft?.slug}`;

  return (
    <>
      <AdminHeading title="Pages & Content" subtitle="Edit structured page sections. No HTML required." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className="tc-input max-w-xs" data-testid="content-page-select">
          {pages.map((p) => <option key={p.slug} value={p.slug} label={`${p.title} (${p.slug})`} />)}
        </select>
        {draft && <StatusBadge value={draft.status} />}
        {draft && (
          <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#10A6D8]" data-testid="content-preview-link">
            <ExternalLink size={14} /> Preview public page
          </a>
        )}
      </div>

      {draft && (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-6" data-testid="content-form">
          <div className="grid gap-4 border border-[#8A8F96]/30 bg-white p-5 sm:grid-cols-3">
            <Field label="Page title"><input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="tc-input" data-testid="content-title-input" /></Field>
            <Field label="SEO title"><input value={draft.seo_title || ""} onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })} className="tc-input" /></Field>
            <Field label="SEO description" hint="150–160 characters recommended">
              <input value={draft.seo_description || ""} onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })} className="tc-input" />
            </Field>
          </div>

          {draft.sections.map((s, i) => (
            <fieldset key={s.key} className="border border-[#8A8F96]/30 bg-white p-5" data-testid={`content-section-${s.key}`}>
              <legend className="tc-eyebrow px-1">{s.key}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Heading"><input value={s.heading || ""} onChange={(e) => setSection(i, "heading", e.target.value)} className="tc-input" data-testid={`section-${s.key}-heading`} /></Field>
                <Field label="Subheading"><input value={s.subheading || ""} onChange={(e) => setSection(i, "subheading", e.target.value)} className="tc-input" /></Field>
              </div>
              <div className="mt-4">
                <Field label="Body" hint="Each new line becomes a list item in sections that render lists">
                  <textarea rows={4} value={s.body || ""} onChange={(e) => setSection(i, "body", e.target.value)} className="tc-input" data-testid={`section-${s.key}-body`} />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Image URL"><input value={s.image_url || ""} onChange={(e) => setSection(i, "image_url", e.target.value)} className="tc-input" placeholder="https://" /></Field>
              </div>
            </fieldset>
          ))}

          <div className="flex flex-wrap gap-3 border-t border-[#8A8F96]/25 pt-5">
            <button type="submit" className="tc-btn-outline" disabled={saving} data-testid="content-save-draft">Save changes</button>
            <button type="button" className="tc-btn-primary" disabled={saving} onClick={() => save("published")} data-testid="content-publish">Publish</button>
            <button type="button" className="tc-btn-ghost text-[13px]" disabled={saving} onClick={() => save("draft")} data-testid="content-unpublish">Unpublish</button>
          </div>
        </form>
      )}
    </>
  );
}
