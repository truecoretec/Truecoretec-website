import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { AdminHeading, DataTable, Modal, Field } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);
const ROLES = ["super_admin", "content_manager", "enquiry_manager"];
const BLANK = { username: "", email: "", name: "", password: "", role: "content_manager" };

export default function AdminUsers() {
  const { data, mutate } = useSWR("/auth/users", fetcher);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/users", form);
      toast.success("Admin user created");
      setForm(BLANK);
      setOpen(false);
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  const patch = async (id, body) => {
    try {
      await api.patch(`/auth/users/${id}`, body);
      toast.success("User updated");
      mutate();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <>
      <AdminHeading
        title="Admin Users"
        subtitle="There is no public registration. Roles are enforced by the backend on every protected request."
        action={<button type="button" className="tc-btn-primary" onClick={() => setOpen(true)} data-testid="new-user-button"><Plus size={16} /> New User</button>}
      />

      <DataTable
        testId="admin-users-table"
        columns={["Name", "Username", "Email", "Role", "Active", "Actions"]}
        empty="No admin users."
        rows={(data || []).map((u) => (
          <tr key={u.id} className="border-t border-[#8A8F96]/20 text-[14px]">
            <td className="px-4 py-3 font-medium text-[#003B7A]">{u.name}</td>
            <td className="tc-mono px-4 py-3">{u.username}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3">
              <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })} className="tc-input !py-1.5 !text-[13px]" data-testid={`user-role-${u.username}`}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </td>
            <td className="px-4 py-3">{u.active ? "Yes" : "No"}</td>
            <td className="px-4 py-3">
              <button type="button" className="text-[13px] font-semibold text-[#10A6D8]" onClick={() => patch(u.id, { active: !u.active })} data-testid={`toggle-user-${u.username}`}>
                {u.active ? "Deactivate" : "Activate"}
              </button>
            </td>
          </tr>
        ))}
      />

      <div className="mt-10 max-w-3xl border border-[#8A8F96]/30 bg-white p-5">
        <h2 className="text-lg font-semibold">Role capabilities</h2>
        <ul className="mt-4 space-y-2 text-[14px] text-[#3F434A]">
          <li><strong className="text-[#003B7A]">Super Admin</strong> — all settings, users, content, enquiries, exports and audit logs.</li>
          <li><strong className="text-[#003B7A]">Content Manager</strong> — products, categories, industries, pages, directors and media.</li>
          <li><strong className="text-[#003B7A]">Enquiry Manager</strong> — enquiry inbox, statuses, notes and CSV export.</li>
        </ul>
      </div>

      <Modal open={open} title="New admin user" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-5" data-testid="user-form">
          <Field label="Full name" required><input required value={form.name} onChange={(e) => set("name", e.target.value)} className="tc-input" data-testid="user-name-input" /></Field>
          <Field label="Username" required><input required value={form.username} onChange={(e) => set("username", e.target.value)} className="tc-input" data-testid="user-username-input" /></Field>
          <Field label="Email" required><input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="tc-input" data-testid="user-email-input" /></Field>
          <Field label="Password" required hint="Minimum 8 characters"><input required type="password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} className="tc-input" data-testid="user-password-input" /></Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className="tc-input" data-testid="user-role-select">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
          </Field>
          <div className="flex gap-3 border-t border-[#8A8F96]/25 pt-5">
            <button type="submit" className="tc-btn-primary" data-testid="user-save-button">Create user</button>
            <button type="button" className="tc-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
