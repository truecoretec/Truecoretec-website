import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Trash2, Copy } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminHeading, Modal, Field } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);
const BLANK = { title: "", url: "", alt_text: "", caption: "", kind: "image" };

export default function AdminMedia() {
  const { data, mutate } = useSWR("/admin/media", fetcher);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/media", form);
      toast.success("Media reference added");
      setForm(BLANK);
      setOpen(false);
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove "${m.title}" from the library?`)) return;
    try {
      await api.delete(`/admin/media/${m.id}`);
      toast.success("Removed");
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <>
      <AdminHeading
        title="Media Library"
        subtitle="Store image and document URLs with alt text, then reuse them in products, categories and pages."
        action={<button type="button" className="tc-btn-primary" onClick={() => setOpen(true)} data-testid="new-media-button"><Plus size={16} /> Add Media URL</button>}
      />

      <div className="mb-6 border-l-2 border-[#10A6D8] bg-[#EDEDED]/50 p-4 text-[14px] text-[#3F434A]" data-testid="media-upload-note">
        Direct file uploads are not enabled in this build. Media is referenced by URL from your own hosting or storage.
      </div>

      {data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="media-grid">
          {data.map((m) => (
            <figure key={m.id} className="border border-[#8A8F96]/30 bg-white">
              <div className="aspect-[16/10] bg-[#EDEDED]">
                {m.kind === "image" ? (
                  <img src={m.url} alt={m.alt_text || m.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-[#8A8F96]">Document</div>
                )}
              </div>
              <figcaption className="p-4">
                <p className="text-[14px] font-semibold text-[#003B7A]">{m.title}</p>
                <p className="mt-1 break-all text-[12px] text-[#8A8F96]">{m.url}</p>
                {m.alt_text && <p className="mt-2 text-[13px] text-[#3F434A]">Alt: {m.alt_text}</p>}
                <div className="mt-3 flex gap-4">
                  <button type="button" className="flex items-center gap-1 text-[12px] font-semibold text-[#10A6D8]"
                    onClick={() => { navigator.clipboard?.writeText(m.url); toast.success("URL copied"); }}>
                    <Copy size={13} /> Copy URL
                  </button>
                  <button type="button" className="flex items-center gap-1 text-[12px] font-semibold text-[#8A8F96] hover:text-[#DC2626]" onClick={() => remove(m)}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-[#8A8F96]/40 p-10 text-center text-[14px] text-[#8A8F96]" data-testid="media-empty">
          No media references yet.
        </p>
      )}

      <Modal open={open} title="Add media reference" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-5" data-testid="media-form">
          <Field label="Title" required><input required value={form.title} onChange={(e) => set("title", e.target.value)} className="tc-input" data-testid="media-title-input" /></Field>
          <Field label="URL" required hint="Must start with http:// or https://">
            <input required value={form.url} onChange={(e) => set("url", e.target.value)} className="tc-input" placeholder="https://" data-testid="media-url-input" />
          </Field>
          <Field label="Alt text" hint="Describe the image for screen readers; leave empty for decorative images">
            <input value={form.alt_text} onChange={(e) => set("alt_text", e.target.value)} className="tc-input" />
          </Field>
          <Field label="Caption"><input value={form.caption} onChange={(e) => set("caption", e.target.value)} className="tc-input" /></Field>
          <Field label="Type">
            <select value={form.kind} onChange={(e) => set("kind", e.target.value)} className="tc-input">
              <option value="image">Image</option>
              <option value="document">Document</option>
            </select>
          </Field>
          <div className="flex gap-3 border-t border-[#8A8F96]/25 pt-5">
            <button type="submit" className="tc-btn-primary" data-testid="media-save-button">Save</button>
            <button type="button" className="tc-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
