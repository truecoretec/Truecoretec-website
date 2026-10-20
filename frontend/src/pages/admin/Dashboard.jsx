import useSWR from "swr";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { AdminHeading, DataTable, StatusBadge } from "@/components/admin/AdminUI";

const fetcher = (url) => api.get(url).then((r) => r.data);

const Metric = ({ label, value, testId }) => (
  <div className="border border-[#8A8F96]/30 bg-white p-5" data-testid={testId}>
    <p className="tc-eyebrow">{label}</p>
    <p className="mt-3 text-3xl font-extrabold text-[#003B7A]">{value}</p>
  </div>
);

export default function Dashboard() {
  const { data } = useSWR("/admin/dashboard", fetcher);

  if (!data) return <p className="text-[#8A8F96]">Loading dashboard…</p>;

  return (
    <>
      <AdminHeading title="Dashboard" subtitle="All metrics are derived from stored records." />

      {!data.email_notifications_configured && (
        <div className="mb-8 border-l-2 border-[#D97706] bg-[#D97706]/5 p-4 text-[14px] text-[#3F434A]" data-testid="email-not-configured-warning">
          <strong className="text-[#003B7A]">Email notifications are not configured.</strong> Enquiries are saved to the
          database and visible in the inbox, but no notification email is sent. Configure a transactional email provider
          to enable notifications.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total enquiries" value={data.total_enquiries} testId="metric-total-enquiries" />
        <Metric label="Open enquiries" value={data.open_enquiries} testId="metric-open-enquiries" />
        <Metric label="Last 7 days" value={data.last_7_days} testId="metric-last-7-days" />
        <Metric label="Last 30 days" value={data.last_30_days} testId="metric-last-30-days" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section>
          <h2 className="text-lg font-semibold">Enquiries by status</h2>
          <ul className="mt-4 divide-y divide-[#8A8F96]/25 border border-[#8A8F96]/30 bg-white" data-testid="enquiries-by-status">
            {Object.entries(data.by_status).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between px-4 py-3">
                <StatusBadge value={status} />
                <span className="tc-mono text-[15px] text-[#003B7A]">{count}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-lg font-semibold">Catalogue</h2>
          <ul className="mt-4 divide-y divide-[#8A8F96]/25 border border-[#8A8F96]/30 bg-white text-[14px]">
            <li className="flex justify-between px-4 py-3"><span>Published products</span><span className="tc-mono">{data.products_published}</span></li>
            <li className="flex justify-between px-4 py-3"><span>Draft products</span><span className="tc-mono">{data.products_draft}</span></li>
            <li className="flex justify-between px-4 py-3"><span>Published categories</span><span className="tc-mono">{data.categories_published}</span></li>
            <li className="flex justify-between px-4 py-3"><span>Published industries</span><span className="tc-mono">{data.industries_published}</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Recent enquiries</h2>
          <div className="mt-4">
            <DataTable
              testId="recent-enquiries-table"
              columns={["Reference", "Company", "Status", "Received"]}
              empty="No enquiries received yet."
              rows={data.recent_enquiries.map((e) => (
                <tr key={e.id} className="border-t border-[#8A8F96]/20 text-[14px]">
                  <td className="px-4 py-3">
                    <Link to="/admin/enquiries" className="tc-mono text-[#10A6D8] hover:underline">{e.reference_number}</Link>
                  </td>
                  <td className="px-4 py-3">{e.company_name}</td>
                  <td className="px-4 py-3"><StatusBadge value={e.status} /></td>
                  <td className="px-4 py-3 text-[#8A8F96]">{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))}
            />
          </div>
        </section>
      </div>
    </>
  );
}
