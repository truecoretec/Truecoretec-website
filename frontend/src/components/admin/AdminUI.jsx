import { X } from "lucide-react";

export const Field = ({ label, children, hint, required }) => (
  <label className="block">
    <span className="tc-label">
      {label} {required && <span className="text-[#DC2626]">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[12px] text-[#8A8F96]">{hint}</span>}
  </label>
);

export const Modal = ({ open, title, onClose, children, wide = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#003B7A]/40 p-4 sm:p-8">
      <div
        className={`w-full ${wide ? "max-w-4xl" : "max-w-2xl"} border border-[#8A8F96]/40 bg-white shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="admin-modal"
      >
        <div className="flex items-center justify-between border-b border-[#8A8F96]/25 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" data-testid="admin-modal-close"
            className="text-[#8A8F96] hover:text-[#003B7A]">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

const STATUS_STYLES = {
  published: "bg-[#0D8A58]/10 text-[#0D8A58] border-[#0D8A58]/40",
  draft: "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/40",
  archived: "bg-[#8A8F96]/15 text-[#3F434A] border-[#8A8F96]/40",
  new: "bg-[#10A6D8]/10 text-[#003B7A] border-[#10A6D8]/40",
  notified: "bg-[#10A6D8]/10 text-[#003B7A] border-[#10A6D8]/40",
  in_progress: "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/40",
  responded: "bg-[#0D8A58]/10 text-[#0D8A58] border-[#0D8A58]/40",
  qualified: "bg-[#0D8A58]/15 text-[#0D8A58] border-[#0D8A58]/40",
  closed: "bg-[#8A8F96]/15 text-[#3F434A] border-[#8A8F96]/40",
};

export const StatusBadge = ({ value }) => (
  <span className={`inline-block border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[value] || STATUS_STYLES.archived}`}>
    {(value || "").replace("_", " ")}
  </span>
);

export const AdminHeading = ({ title, subtitle, action }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-[14px] text-[#3F434A]">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const DataTable = ({ columns, rows, empty, testId }) => (
  <div className="overflow-x-auto border border-[#8A8F96]/30 bg-white">
    <table className="w-full min-w-[640px] text-left" data-testid={testId}>
      <thead className="bg-[#EDEDED]">
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#003B7A]">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? rows : (
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center text-[14px] text-[#8A8F96]">
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export const Pager = ({ page, pages, onChange }) => {
  if (!pages || pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center gap-2" aria-label="Pagination">
      <button type="button" className="tc-btn-outline !py-2" disabled={page <= 1} onClick={() => onChange(page - 1)} data-testid="pager-prev">
        Prev
      </button>
      <span className="px-2 text-[13px] text-[#3F434A]">Page {page} of {pages}</span>
      <button type="button" className="tc-btn-outline !py-2" disabled={page >= pages} onClick={() => onChange(page + 1)} data-testid="pager-next">
        Next
      </button>
    </nav>
  );
};

export const listInput = (value) => (value || []).join("\n");
export const parseList = (value) => (value || "").split("\n").map((v) => v.trim()).filter(Boolean);
