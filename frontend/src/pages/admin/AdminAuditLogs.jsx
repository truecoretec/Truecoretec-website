import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { AdminHeading, DataTable, Pager } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const { data } = useSWR(`/admin/audit-logs?page=${page}&page_size=25`, fetcher);

  return (
    <>
      <AdminHeading title="Audit Logs" subtitle="Security-relevant administrative actions. Visible to super admins only." />
      <DataTable
        testId="audit-logs-table"
        columns={["When", "Actor", "Action", "Entity", "Detail"]}
        empty="No audit events recorded yet."
        rows={(data?.items || []).map((l) => (
          <tr key={l.id} className="border-t border-[#8A8F96]/20 text-[14px]">
            <td className="px-4 py-3 text-[#8A8F96]">{new Date(l.created_at).toLocaleString()}</td>
            <td className="px-4 py-3">{l.actor_username || "—"}</td>
            <td className="px-4 py-3 font-medium text-[#003B7A]">{l.action}</td>
            <td className="px-4 py-3">{l.entity}</td>
            <td className="px-4 py-3">{l.detail || "—"}</td>
          </tr>
        ))}
      />
      <Pager page={page} pages={data?.pages || 1} onChange={setPage} />
    </>
  );
}
