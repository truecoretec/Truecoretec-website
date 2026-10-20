import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Pencil, Archive } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminHeading, DataTable, Modal, Field, StatusBadge, listInput, parseList } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);

const BLANK = {
  name: "", slug: "", overview: "", applications: "", requirements: "", image_url: "",
  category_ids: [], seo_title: "", seo_description: "", sort_order: 0, status: "draft",
};

export default function AdminIndustries() {
  const { data, mutate } = useSWR("/admin/industries", fetcher);
  const { data: categories } = useSWR("/admin/categories", fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, applications: parseList(form.applications), sort_order: Number(form.sort_order) || 0 };
    ["id", "created_at", "updated_at"].forEach((k) => delete payload[k]);
    try {
      if (editing) await api.patch(`/admin/industries/${editing.id}`, payload);
      else await api.post("/admin/industries", payload);
      toast.success(editing ? "Industry updated" : "Industry created");
      setOpen(false);
      mutate();
    } catch (err) { toast.error(apiError(err)); } finally { setSaving(false); }
  };

  const archive = async (i) => {
    if (!window.confirm(`Archive "${i.name}"?`)) return;
    try {
      await api.delete(`/admin/industries/${i.id}`);
      toast.success("Industry archived");
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <>
      <AdminHeading
        title="Industries"
        subtitle="Keep an industry in draft until the company confirms it is served."
        action={<button type="button" className="tc-btn-primary" onClick={() => { setEditing(null); setForm(BLANK); setOpen(true); }} data-testid="new-industry-button"><Plus size={16} /> New Industry</button>}
      />

      <DataTable
        testId="admin-industries-table"
        columns={["Name", "Slug", "Status", "Actions"]}
        empty="No industries yet."
        rows={(data || []).map((i) => (
          <tr key={i.id} className="border-t border-[#8A8F96]/20 text-[14px]" data-testid={`admin-industry-row-${i.slug}`}>
            <td className="px-4 py-3 font-medium text-[#003B7A]">{i.name}</td>
            <td className="tc-mono px-4 py-3 text-[#8A8F96]">{i.slug}</td>
            <td className="px-4 py-3"><StatusBadge value={i.status} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-3">
                <button type="button" onClick={() => { setEditing(i); setForm({ ...BLANK, ...i, applications: listInput(i.applications), category_ids: i.category_ids || [] }); setOpen(true); }}
                  className="text-[#10A6D8]" aria-label={`Edit ${i.name}`} data-testid={`edit-industry-${i.slug}`}><Pencil size={16} /></button>
                <button type="button" onClick={() => archive(i)} className="text-[#8A8F96] hover:text-[#DC2626]" aria-label={`Archive ${i.name}`}><Archive size={16} /></button>
              </div>
            </td>
          </tr>
        ))}
      />

      <Modal open={open} wide title={editing ? `Edit: ${editing.name}` : "New industry"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-5" data-testid="industry-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required><input required value={form.name} onChange={(e) => set("name", e.target.value)} className="tc-input" data-testid="industry-name-input" /></Field>
            <Field label="Slug" hint="Auto-generated if blank"><input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="tc-input" /></Field>
          </div>
          <Field label="Overview"><textarea rows={4} value={form.overview || ""} onChange={(e) => set("overview", e.target.value)} className="tc-input" data-testid="industry-overview-input" /></Field>
          <Field label="Applications" hint="One per line"><textarea rows={4} value={form.applications} onChange={(e) => set("applications", e.target.value)} className="tc-input" /></Field>
          <Field label="Application-specific requirements"><textarea rows={3} value={form.requirements || ""} onChange={(e) => set("requirements", e.target.value)} className="tc-input" /></Field>
          <Field label="Hero image URL"><input value={form.image_url || ""} onChange={(e) => set("image_url", e.target.value)} className="tc-input" placeholder="https://" /></Field>
          <Field label="Relevant categories">
            <div className="flex flex-wrap gap-3 border border-[#8A8F96]/30 p-3">
              {(categories || []).length === 0 && <span className="text-[13px] text-[#8A8F96]">No categories yet.</span>}
              {(categories || []).map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" checked={form.category_ids.includes(c.id)}
                    onChange={(e) => set("category_ids", e.target.checked ? [...form.category_ids, c.id] : form.category_ids.filter((x) => x !== c.id))} />
                  {c.name}
                </label>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="tc-input" data-testid="industry-status-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Sort order"><input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="tc-input" /></Field>
            <Field label="SEO title"><input value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} className="tc-input" /></Field>
            <Field label="SEO description"><input value={form.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} className="tc-input" /></Field>
          </div>
          <div className="flex gap-3 border-t border-[#8A8F96]/25 pt-5">
            <button type="submit" className="tc-btn-primary" disabled={saving} data-testid="industry-save-button">{saving ? "Saving…" : "Save industry"}</button>
            <button type="button" className="tc-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
