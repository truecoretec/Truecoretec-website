import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Pencil, Archive } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminHeading, DataTable, Modal, Field, StatusBadge } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);
const BLANK = { name: "", designation: "", short_intro: "", bio: "", photo_url: "", linkedin_url: "", sort_order: 0, status: "draft" };

export default function AdminDirectors() {
  const { data, mutate } = useSWR("/admin/directors", fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    ["id", "created_at"].forEach((k) => delete payload[k]);
    try {
      if (editing) await api.patch(`/admin/directors/${editing.id}`, payload);
      else await api.post("/admin/directors", payload);
      toast.success(editing ? "Director updated" : "Director added");
      setOpen(false);
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  const archive = async (d) => {
    if (!window.confirm(`Archive "${d.name}"?`)) return;
    try {
      await api.delete(`/admin/directors/${d.id}`);
      toast.success("Director archived");
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <>
      <AdminHeading
        title="Team / Directors"
        subtitle="Publish a profile only when the name, designation and biography are approved."
        action={<button type="button" className="tc-btn-primary" onClick={() => { setEditing(null); setForm(BLANK); setOpen(true); }} data-testid="new-director-button"><Plus size={16} /> Add Director</button>}
      />
      <DataTable
        testId="admin-directors-table"
        columns={["Name", "Designation", "Status", "Actions"]}
        empty="No director profiles yet."
        rows={(data || []).map((d) => (
          <tr key={d.id} className="border-t border-[#8A8F96]/20 text-[14px]">
            <td className="px-4 py-3 font-medium text-[#003B7A]">{d.name}</td>
            <td className="px-4 py-3">{d.designation || "—"}</td>
            <td className="px-4 py-3"><StatusBadge value={d.status} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-3">
                <button type="button" onClick={() => { setEditing(d); setForm({ ...BLANK, ...d }); setOpen(true); }} className="text-[#10A6D8]" aria-label={`Edit ${d.name}`}><Pencil size={16} /></button>
                <button type="button" onClick={() => archive(d)} className="text-[#8A8F96] hover:text-[#DC2626]" aria-label={`Archive ${d.name}`}><Archive size={16} /></button>
              </div>
            </td>
          </tr>
        ))}
      />

      <Modal open={open} title={editing ? `Edit: ${editing.name}` : "Add director"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-5" data-testid="director-form">
          <Field label="Full name" required><input required value={form.name} onChange={(e) => set("name", e.target.value)} className="tc-input" data-testid="director-name-input" /></Field>
          <Field label="Designation"><input value={form.designation || ""} onChange={(e) => set("designation", e.target.value)} className="tc-input" /></Field>
          <Field label="Short introduction" hint="2–3 lines shown on the directors page card">
            <textarea rows={3} maxLength={600} value={form.short_intro || ""} onChange={(e) => set("short_intro", e.target.value)} className="tc-input" data-testid="director-short-intro-input" />
          </Field>
          <Field label="Full biography" hint="Shown in the View Profile popup. Separate paragraphs with a blank line.">
            <textarea rows={6} value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} className="tc-input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Photo URL"><input value={form.photo_url || ""} onChange={(e) => set("photo_url", e.target.value)} className="tc-input" placeholder="https://" /></Field>
            <Field label="LinkedIn URL"><input value={form.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} className="tc-input" placeholder="https://" /></Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="tc-input" data-testid="director-status-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Sort order"><input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="tc-input" /></Field>
          </div>
          <div className="flex gap-3 border-t border-[#8A8F96]/25 pt-5">
            <button type="submit" className="tc-btn-primary" data-testid="director-save-button">Save profile</button>
            <button type="button" className="tc-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
