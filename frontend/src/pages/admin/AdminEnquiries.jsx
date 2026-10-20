import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Mail, MessageCircle, Download } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AdminHeading, DataTable, Modal, Field, StatusBadge, Pager } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);
const STATUSES = ["new", "notified", "in_progress", "responded", "qualified", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

export default function AdminEnquiries() {
  const { admin } = useAuth();
  const [filters, setFilters] = useState({ q: "", status: "", priority: "", date_from: "", date_to: "" });
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), page_size: "20" });
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  const { data, mutate } = useSWR(`/admin/enquiries?${params.toString()}`, fetcher);

  const [openId, setOpenId] = useState(null);
  const { data: detail, mutate: mutateDetail } = useSWR(openId ? `/admin/enquiries/${openId}` : null, fetcher);
  const { data: users } = useSWR(admin?.role === "super_admin" ? "/auth/users" : null, fetcher);
  const [note, setNote] = useState("");

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  const update = async (patch) => {
    try {
      await api.patch(`/admin/enquiries/${openId}`, patch);
      toast.success("Enquiry updated");
      mutateDetail();
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await api.post(`/admin/enquiries/${openId}/notes`, { note });
      setNote("");
      toast.success("Internal note added");
      mutateDetail();
    } catch (err) { toast.error(apiError(err)); }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get("/admin/enquiries/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "enquiries.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(apiError(err)); }
  };

  const e = detail?.enquiry;

  return (
    <>
      <AdminHeading
        title="Enquiries"
        subtitle="Every submission is stored with a unique reference. Internal notes are never shown publicly."
        action={<button type="button" className="tc-btn-outline" onClick={exportCsv} data-testid="export-enquiries-button"><Download size={16} /> Export CSV</button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="enquiry-filters">
        <input value={filters.q} onChange={(ev) => setFilter("q", ev.target.value)} placeholder="Reference, name, company, email" className="tc-input" data-testid="enquiry-search-input" />
        <select value={filters.status} onChange={(ev) => setFilter("status", ev.target.value)} className="tc-input" data-testid="enquiry-status-filter">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select value={filters.priority} onChange={(ev) => setFilter("priority", ev.target.value)} className="tc-input" data-testid="enquiry-priority-filter">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(ev) => setFilter("date_from", ev.target.value)} className="tc-input" aria-label="From date" />
        <input type="date" value={filters.date_to} onChange={(ev) => setFilter("date_to", ev.target.value)} className="tc-input" aria-label="To date" />
      </div>

      <DataTable
        testId="admin-enquiries-table"
        columns={["Reference", "Company", "Contact", "City", "Type", "Status", "Priority", "Received"]}
        empty="No enquiries match the current filters."
        rows={(data?.items || []).map((row) => (
          <tr key={row.id} className="cursor-pointer border-t border-[#8A8F96]/20 text-[14px] hover:bg-[#EDEDED]/50"
            onClick={() => setOpenId(row.id)} data-testid={`enquiry-row-${row.reference_number}`}>
            <td className="tc-mono px-4 py-3 text-[#10A6D8]">{row.reference_number}</td>
            <td className="px-4 py-3">{row.company_name}</td>
            <td className="px-4 py-3">{row.name}</td>
            <td className="px-4 py-3">{row.city || "—"}</td>
            <td className="px-4 py-3 text-[13px]">{(row.enquirer_type || "—").replace("_", " ")}</td>
            <td className="px-4 py-3"><StatusBadge value={row.status} /></td>
            <td className="px-4 py-3 uppercase text-[12px]">{row.priority}</td>
            <td className="px-4 py-3 text-[#8A8F96]">{new Date(row.created_at).toLocaleString()}</td>
          </tr>
        ))}
      />
      <Pager page={page} pages={data?.pages || 1} onChange={setPage} />

      <Modal open={Boolean(openId)} wide title={e ? `Enquiry ${e.reference_number}` : "Enquiry"} onClose={() => setOpenId(null)}>
        {e && (
          <div className="space-y-7" data-testid="enquiry-detail">
            <dl className="grid gap-4 border border-[#8A8F96]/30 p-4 sm:grid-cols-2 text-[14px]">
              {[
                ["Name", e.name], ["Company", e.company_name], ["Email", e.email], ["Phone", e.phone],
                ["City", e.city || "—"], ["Enquirer type", (e.enquirer_type || "—").replace("_", " ")],
                ["Product", e.product_name || "—"], ["Industry", e.industry_name || "—"],
                ["Source page", e.source_page || "—"],
                ["Received", new Date(e.created_at).toLocaleString()],
                ["Notification", e.notification_status],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="tc-eyebrow">{k}</dt>
                  <dd className="mt-1 text-[#3F434A]">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="tc-eyebrow">Requirement</p>
              <p className="mt-2 whitespace-pre-line border-l-2 border-[#10A6D8] bg-[#EDEDED]/50 p-4 text-[15px] text-[#3F434A]">
                {e.requirement || "Not provided"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Status">
                <select value={e.status} onChange={(ev) => update({ status: ev.target.value })} className="tc-input" data-testid="enquiry-status-select">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={e.priority} onChange={(ev) => update({ priority: ev.target.value })} className="tc-input" data-testid="enquiry-priority-select">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Assigned to">
                <select value={e.assigned_admin_id || ""} onChange={(ev) => update({ assigned_admin_id: ev.target.value })} className="tc-input" data-testid="enquiry-assign-select">
                  <option value="">Unassigned</option>
                  {(users || []).map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${e.email}?subject=TrueCore enquiry ${e.reference_number}`} className="tc-btn-outline" data-testid="enquiry-email-reply">
                <Mail size={16} /> Reply by email
              </a>
              <a href={`https://wa.me/${(e.phone || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="tc-btn-outline" data-testid="enquiry-whatsapp-open">
                <MessageCircle size={16} /> Open WhatsApp
              </a>
            </div>

            <div>
              <p className="tc-eyebrow">Internal notes (private)</p>
              <form onSubmit={addNote} className="mt-3 flex gap-3">
                <input value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Add a follow-up note" className="tc-input" data-testid="enquiry-note-input" />
                <button type="submit" className="tc-btn-primary" data-testid="enquiry-note-submit">Add</button>
              </form>
              <ul className="mt-4 space-y-2" data-testid="enquiry-notes-list">
                {(detail.notes || []).map((n) => (
                  <li key={n.id} className="border border-[#8A8F96]/25 p-3 text-[14px]">
                    <p className="text-[#3F434A]">{n.note}</p>
                    <p className="mt-1 text-[12px] text-[#8A8F96]">{n.author} · {new Date(n.created_at).toLocaleString()}</p>
                  </li>
                ))}
                {(detail.notes || []).length === 0 && <li className="text-[13px] text-[#8A8F96]">No internal notes yet.</li>}
              </ul>
            </div>

            <div>
              <p className="tc-eyebrow">Status history</p>
              <ol className="mt-3 space-y-1 text-[13px] text-[#3F434A]" data-testid="enquiry-history">
                {(detail.history || []).map((h) => (
                  <li key={h.id}>
                    {h.from_status ? `${h.from_status} → ` : "created as "}{h.to_status} · {h.actor} · {new Date(h.created_at).toLocaleString()}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
