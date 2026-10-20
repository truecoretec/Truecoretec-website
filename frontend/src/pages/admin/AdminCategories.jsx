import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Pencil, Archive } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminHeading, DataTable, Modal, Field, StatusBadge } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);

const BLANK = {
  name: "", slug: "", summary: "", description: "", image_url: "", parent_id: "",
  seo_title: "", seo_description: "", sort_order: 0, status: "draft",
};

export default function AdminCategories() {
  const { data, mutate } = useSWR("/admin/categories", fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0, parent_id: form.parent_id || null };
    ["id", "created_at", "updated_at"].forEach((k) => delete payload[k]);
    try {
      if (editing) await api.patch(`/admin/categories/${editing.id}`, payload);
      else await api.post("/admin/categories", payload);
      toast.success(editing ? "Category updated" : "Category created");
      setOpen(false);
      mutate();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const archive = async (c) => {
    if (!window.confirm(`Archive "${c.name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      toast.success("Category archived");
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <>
      <AdminHeading
        title="Product Categories"
        subtitle="Categories group the catalogue and can be nested using a parent category."
        action={<button type="button" className="tc-btn-primary" onClick={() => { setEditing(null); setForm(BLANK); setOpen(true); }} data-testid="new-category-button"><Plus size={16} /> New Category</button>}
      />

      <DataTable
        testId="admin-categories-table"
        columns={["Name", "Slug", "Parent", "Status", "Actions"]}
        empty="No categories yet."
        rows={(data || []).map((c) => (
          <tr key={c.id} className="border-t border-[#8A8F96]/20 text-[14px]" data-testid={`admin-category-row-${c.slug}`}>
            <td className="px-4 py-3 font-medium text-[#003B7A]">{c.name}</td>
            <td className="tc-mono px-4 py-3 text-[#8A8F96]">{c.slug}</td>
            <td className="px-4 py-3">{(data || []).find((p) => p.id === c.parent_id)?.name || "—"}</td>
            <td className="px-4 py-3"><StatusBadge value={c.status} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-3">
                <button type="button" onClick={() => { setEditing(c); setForm({ ...BLANK, ...c, parent_id: c.parent_id || "" }); setOpen(true); }}
                  className="text-[#10A6D8]" aria-label={`Edit ${c.name}`} data-testid={`edit-category-${c.slug}`}><Pencil size={16} /></button>
                <button type="button" onClick={() => archive(c)} className="text-[#8A8F96] hover:text-[#DC2626]" aria-label={`Archive ${c.name}`}><Archive size={16} /></button>
              </div>
            </td>
          </tr>
        ))}
      />

      <Modal open={open} title={editing ? `Edit: ${editing.name}` : "New category"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-5" data-testid="category-form">
          <Field label="Name" required>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="tc-input" data-testid="category-name-input" />
          </Field>
          <Field label="Slug" hint="Auto-generated if blank">
            <input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="tc-input" />
          </Field>
          <Field label="Summary"><textarea rows={2} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} className="tc-input" data-testid="category-summary-input" /></Field>
          <Field label="Description"><textarea rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="tc-input" /></Field>
          <Field label="Image URL"><input value={form.image_url || ""} onChange={(e) => set("image_url", e.target.value)} className="tc-input" placeholder="https://" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent category">
              <select value={form.parent_id || ""} onChange={(e) => set("parent_id", e.target.value)} className="tc-input">
                <option value="">None</option>
                {(data || []).filter((c) => !editing || c.id !== editing.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="tc-input" data-testid="category-status-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="SEO title"><input value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} className="tc-input" /></Field>
            <Field label="SEO description"><input value={form.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} className="tc-input" /></Field>
            <Field label="Sort order"><input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="tc-input" /></Field>
          </div>
          <div className="flex gap-3 border-t border-[#8A8F96]/25 pt-5">
            <button type="submit" className="tc-btn-primary" disabled={saving} data-testid="category-save-button">{saving ? "Saving…" : "Save category"}</button>
            <button type="button" className="tc-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
