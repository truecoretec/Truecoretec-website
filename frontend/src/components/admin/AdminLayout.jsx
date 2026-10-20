import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Package, FolderTree, Factory, FileText, Inbox, Image, Users, Settings,
  UserCog, ScrollText, LogOut, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ITEMS = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, roles: "all", end: true },
  { to: "/admin/products", label: "Products", Icon: Package, roles: ["super_admin", "content_manager"] },
  { to: "/admin/categories", label: "Categories", Icon: FolderTree, roles: ["super_admin", "content_manager"] },
  { to: "/admin/industries", label: "Industries", Icon: Factory, roles: ["super_admin", "content_manager"] },
  { to: "/admin/content", label: "Pages & Content", Icon: FileText, roles: ["super_admin", "content_manager"] },
  { to: "/admin/directors", label: "Directors", Icon: Users, roles: ["super_admin", "content_manager"] },
  { to: "/admin/media", label: "Media Library", Icon: Image, roles: ["super_admin", "content_manager"] },
  { to: "/admin/enquiries", label: "Enquiries", Icon: Inbox, roles: ["super_admin", "enquiry_manager"] },
  { to: "/admin/settings", label: "Site Settings", Icon: Settings, roles: ["super_admin"] },
  { to: "/admin/users", label: "Admin Users", Icon: UserCog, roles: ["super_admin"] },
  { to: "/admin/audit-logs", label: "Audit Logs", Icon: ScrollText, roles: ["super_admin"] },
];

export default function AdminLayout() {
  const { admin, ready, logout } = useAuth();
  const navigate = useNavigate();

  if (!ready) {
    return <div className="p-10 text-[#8A8F96]" data-testid="admin-loading">Checking session…</div>;
  }
  if (!admin) return <Navigate to="/admin/login" replace />;

  const visible = ITEMS.filter((i) => i.roles === "all" || i.roles.includes(admin.role));

  return (
    <div className="flex min-h-screen bg-[#EDEDED]/50">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#003B7A] text-white lg:flex" data-testid="admin-sidebar">
        <div className="border-b border-white/15 px-6 py-5">
          <p className="text-[14px] font-extrabold tracking-tight">TRUECORE<span className="text-[#10A6D8]">.</span></p>
          <p className="tc-eyebrow !text-white/50">Admin Portal</p>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
          {visible.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-[14px] transition-colors ${
                  isActive ? "bg-[#10A6D8] text-white" : "text-white/80 hover:bg-white/10"
                }`
              }
              data-testid={`admin-nav-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            >
              <Icon size={17} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/15 p-4 text-[13px]">
          <p className="font-semibold">{admin.name}</p>
          <p className="text-white/60">{admin.role.replace("_", " ")}</p>
          <a href="/" target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-white/70 hover:text-[#10A6D8]">
            <ExternalLink size={14} aria-hidden="true" /> View website
          </a>
          <button
            type="button"
            onClick={async () => { await logout(); navigate("/admin/login"); }}
            className="mt-3 flex items-center gap-2 text-white/70 hover:text-[#10A6D8]"
            data-testid="admin-logout-button"
          >
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-[#8A8F96]/25 bg-white px-5 py-3 lg:hidden">
          <span className="text-[14px] font-extrabold text-[#003B7A]">TRUECORE ADMIN</span>
          <button type="button" onClick={async () => { await logout(); navigate("/admin/login"); }} className="text-[13px] font-semibold text-[#10A6D8]">
            Sign out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-b border-[#8A8F96]/25 bg-white px-4 py-2 lg:hidden" aria-label="Admin mobile">
          {visible.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `whitespace-nowrap px-3 py-1.5 text-[13px] ${isActive ? "bg-[#003B7A] text-white" : "text-[#3F434A]"}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 p-5 lg:p-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
