import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus, Pencil, Archive, ExternalLink } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminHeading, DataTable, Modal, Field, StatusBadge, Pager, listInput, parseList } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);

const BLANK = {
  name: "", slug: "", product_code: "", category_id: "", summary: "", description: "",
  image_url: "", gallery: "", industry_ids: [], applications: "", specifications: [],
  variants: [], documents: [], seo_title: "", seo_description: "", featured: false,
  status: "draft", sort_order: 0,
};

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const key = `/admin/products?page=${page}&page_size=20${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${status}` : ""}`;
  const { data, mutate } = useSWR(key, fetcher);
  const { data: categories } = useSWR("/admin/categories", fetcher);
  const { data: industries } = useSWR("/admin/industries", fetcher);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...BLANK, ...p,
      gallery: listInput(p.gallery),
      applications: listInput(p.applications),
      specifications: p.specifications || [],
      variants: p.variants || [],
      documents: p.documents || [],
      category_id: p.category_id || "",
      industry_ids: p.industry_ids || [],
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      gallery: parseList(form.gallery),
      applications: parseList(form.applications),
      specifications: form.specifications.filter((s) => s.label && s.value),
      variants: form.variants.filter((v) => v.name),
      documents: form.documents.filter((d) => d.title && d.url),
      sort_order: Number(form.sort_order) || 0,
      category_id: form.category_id || null,
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    try {
      if (editing) await api.patch(`/admin/products/${editing.id}`, payload);
      else await api.post("/admin/products", payload);
      toast.success(editing ? "Product updated" : "Product created");
      setOpen(false);
      mutate();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const archive = async (p) => {
    if (!window.confirm(`Archive "${p.name}"? It will be removed from the public catalogue.`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success("Product archived");
      mutate();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <>
      <AdminHeading
        title="Products"
        subtitle="Create, publish and archive catalogue records. Only published products appear on the website."
        action={<button type="button" className="tc-btn-primary" onClick={openNew} data-testid="new-product-button"><Plus size={16} /> New Product</button>}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name or code"
          className="tc-input max-w-xs" data-testid="admin-product-search" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="tc-input max-w-[180px]" data-testid="admin-product-status-filter">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <DataTable
        testId="admin-products-table"
        columns={["Name", "Code", "Status", "Featured", "Actions"]}
        empty="No products yet. Create your first catalogue record."
        rows={(data?.items || []).map((p) => (
          <tr key={p.id} className="border-t border-[#8A8F96]/20 text-[14px]" data-testid={`admin-product-row-${p.slug}`}>
            <td className="px-4 py-3 font-medium text-[#003B7A]">{p.name}</td>
            <td className="tc-mono px-4 py-3 text-[#8A8F96]">{p.product_code || "—"}</td>
            <td className="px-4 py-3"><StatusBadge value={p.status} /></td>
            <td className="px-4 py-3">{p.featured ? "Yes" : "—"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => openEdit(p)} className="text-[#10A6D8] hover:text-[#003B7A]" aria-label={`Edit ${p.name}`} data-testid={`edit-product-${p.slug}`}>
                  <Pencil size={16} />
                </button>
                <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" className="text-[#8A8F96] hover:text-[#003B7A]" aria-label={`Preview ${p.name}`}>
                  <ExternalLink size={16} />
                </a>
                <button type="button" onClick={() => archive(p)} className="text-[#8A8F96] hover:text-[#DC2626]" aria-label={`Archive ${p.name}`} data-testid={`archive-product-${p.slug}`}>
                  <Archive size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      />
      <Pager page={page} pages={Math.max(1, Math.ceil((data?.total || 0) / 20))} onChange={setPage} />

      <Modal open={open} wide title={editing ? `Edit: ${editing.name}` : "New product"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-5" data-testid="product-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" required>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="tc-input" data-testid="product-name-input" />
            </Field>
            <Field label="Slug" hint="Leave blank to auto-generate from the name">
              <input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="tc-input" data-testid="product-slug-input" />
            </Field>
            <Field label="Product code">
              <input value={form.product_code || ""} onChange={(e) => set("product_code", e.target.value)} className="tc-input" />
            </Field>
            <Field label="Category">
              <select value={form.category_id || ""} onChange={(e) => set("category_id", e.target.value)} className="tc-input" data-testid="product-category-select">
                <option value="">Unassigned</option>
                {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="tc-input" data-testid="product-status-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Sort order">
              <input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="tc-input" />
            </Field>
          </div>

          <Field label="Summary" hint="Short description shown on cards">
            <textarea rows={2} maxLength={400} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} className="tc-input" data-testid="product-summary-input" />
          </Field>
          <Field label="Description">
            <textarea rows={5} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="tc-input" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Main image URL">
              <input value={form.image_url || ""} onChange={(e) => set("image_url", e.target.value)} className="tc-input" placeholder="https://" data-testid="product-image-input" />
            </Field>
            <Field label="Gallery URLs" hint="One URL per line">
              <textarea rows={3} value={form.gallery} onChange={(e) => set("gallery", e.target.value)} className="tc-input" />
            </Field>
          </div>

          <Field label="Industries">
            <div className="flex flex-wrap gap-3 border border-[#8A8F96]/30 p-3">
              {(industries || []).length === 0 && <span className="text-[13px] text-[#8A8F96]">No industries created yet.</span>}
              {(industries || []).map((i) => (
                <label key={i.id} className="flex items-center gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    checked={form.industry_ids.includes(i.id)}
                    onChange={(e) =>
                      set("industry_ids", e.target.checked
                        ? [...form.industry_ids, i.id]
                        : form.industry_ids.filter((x) => x !== i.id))
                    }
                  />
                  {i.name}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Applications" hint="One application per line">
            <textarea rows={3} value={form.applications} onChange={(e) => set("applications", e.target.value)} className="tc-input" />
          </Field>

          <fieldset className="border border-[#8A8F96]/30 p-4">
            <legend className="tc-label !mb-0 px-1">Specifications</legend>
            <p className="mb-3 text-[12px] text-[#8A8F96]">Only add values supplied and approved by the company.</p>
            {form.specifications.map((s, i) => (
              <div key={i} className="mb-2 grid gap-2 sm:grid-cols-4">
                <input placeholder="Label" value={s.label} className="tc-input"
                  onChange={(e) => set("specifications", form.specifications.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <input placeholder="Value" value={s.value} className="tc-input"
                  onChange={(e) => set("specifications", form.specifications.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
                <input placeholder="Unit" value={s.unit || ""} className="tc-input"
                  onChange={(e) => set("specifications", form.specifications.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} />
                <div className="flex gap-2">
                  <input placeholder="Notes" value={s.notes || ""} className="tc-input"
                    onChange={(e) => set("specifications", form.specifications.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))} />
                  <button type="button" className="text-[#DC2626]" onClick={() => set("specifications", form.specifications.filter((_, j) => j !== i))} aria-label="Remove specification">×</button>
                </div>
              </div>
            ))}
            <button type="button" className="tc-btn-ghost text-[13px]" data-testid="add-specification-row"
              onClick={() => set("specifications", [...form.specifications, { label: "", value: "", unit: "", notes: "" }])}>
              + Add specification
            </button>
          </fieldset>

          <fieldset className="border border-[#8A8F96]/30 p-4">
            <legend className="tc-label !mb-0 px-1">Variants</legend>
            {form.variants.map((v, i) => (
              <div key={i} className="mb-2 grid gap-2 sm:grid-cols-2">
                <input placeholder="Variant name" value={v.name} className="tc-input"
                  onChange={(e) => set("variants", form.variants.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <div className="flex gap-2">
                  <input placeholder="Detail" value={v.detail || ""} className="tc-input"
                    onChange={(e) => set("variants", form.variants.map((x, j) => j === i ? { ...x, detail: e.target.value } : x))} />
                  <button type="button" className="text-[#DC2626]" onClick={() => set("variants", form.variants.filter((_, j) => j !== i))} aria-label="Remove variant">×</button>
                </div>
              </div>
            ))}
            <button type="button" className="tc-btn-ghost text-[13px]" onClick={() => set("variants", [...form.variants, { name: "", detail: "" }])}>
              + Add variant
            </button>
          </fieldset>

          <fieldset className="border border-[#8A8F96]/30 p-4">
            <legend className="tc-label !mb-0 px-1">Documents</legend>
            {form.documents.map((d, i) => (
              <div key={i} className="mb-2 grid gap-2 sm:grid-cols-2">
                <input placeholder="Title" value={d.title} className="tc-input"
                  onChange={(e) => set("documents", form.documents.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                <div className="flex gap-2">
                  <input placeholder="https://" value={d.url} className="tc-input"
                    onChange={(e) => set("documents", form.documents.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
                  <button type="button" className="text-[#DC2626]" onClick={() => set("documents", form.documents.filter((_, j) => j !== i))} aria-label="Remove document">×</button>
                </div>
              </div>
            ))}
            <button type="button" className="tc-btn-ghost text-[13px]" onClick={() => set("documents", [...form.documents, { title: "", url: "" }])}>
              + Add document
            </button>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SEO title"><input value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} className="tc-input" /></Field>
            <Field label="SEO description" hint="150–160 characters recommended">
              <input value={form.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} className="tc-input" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} data-testid="product-featured-checkbox" />
            Feature on homepage
          </label>

          <div className="flex gap-3 border-t border-[#8A8F96]/25 pt-5">
            <button type="submit" className="tc-btn-primary" disabled={saving} data-testid="product-save-button">
              {saving ? "Saving…" : "Save product"}
            </button>
            <button type="button" className="tc-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
