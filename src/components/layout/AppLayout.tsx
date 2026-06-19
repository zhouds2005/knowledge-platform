import { Link, useLocation, Outlet } from "react-router-dom";
import {
  FileText, BookOpen, HardDrive, ClipboardCheck,
  LayoutDashboard, Building2, Users, Layers, Bell
} from "lucide-react";
import { useAuthContext } from "../../providers/AuthProvider";
import { cn } from "../../lib/utils";

const knowledgeLinks = [
  { to: "/", label: "工作台", icon: LayoutDashboard },
  { to: "/documents/new", label: "文档", icon: FileText },
  { to: "/wiki/new", label: "Wiki", icon: BookOpen },
  { to: "/drive", label: "网盘", icon: HardDrive },
  { to: "/review", label: "审核", icon: ClipboardCheck },
];

const adminLinks = [
  { to: "/admin/users", label: "用户管理", icon: Users },
  { to: "/admin/departments", label: "部门管理", icon: Building2 },
  { to: "/admin/spaces", label: "空间管理", icon: Layers },
];

export default function AppLayout() {
  const { user, logout, notificationCount } = useAuthContext();
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    pathname === to || (to !== "/" && pathname.startsWith(to));

  return (
    <div className="flex min-h-screen bg-page-bg">
      {/* Sidebar */}
      <aside className="w-55 bg-sidebar text-slate-300 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <h1 className="font-serif text-base font-bold text-slate-100 tracking-wide">
            知识平台
          </h1>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            企业知识共享中心
          </span>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider px-2.5 pt-3 pb-1.5">
            知识管理
          </div>
          {knowledgeLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[14px] transition-colors",
                isActive(to)
                  ? "bg-accent text-white font-medium"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-slate-100"
              )}
            >
              <Icon className="w-[18px] h-[18px] opacity-70 shrink-0" />
              {label}
            </Link>
          ))}

          {user?.role === "admin" && (
            <>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider px-2.5 pt-4 pb-1.5">
                系统管理
              </div>
              {adminLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[14px] transition-colors",
                    isActive(to)
                      ? "bg-accent text-white font-medium"
                      : "text-slate-300 hover:bg-sidebar-hover hover:text-slate-100"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] opacity-70 shrink-0" />
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-white/[0.08] flex items-center gap-2.5 text-[13px]">
          <div className="w-[28px] h-[28px] rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.name?.[0] ?? "U"}
          </div>
          <span className="truncate">{user?.name}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[52px] bg-card-bg border-b border-border flex items-center justify-end gap-4 px-7 shrink-0">
          <Link to="/notifications" className="relative text-text-muted hover:text-text">
            <Bell className="w-5 h-5" />
            {(notificationCount ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card-bg" />
            )}
          </Link>
          <span className="text-[14px] text-text">{user?.name}</span>
          <button
            onClick={() => logout()}
            className="text-[14px] text-text-muted hover:text-text"
          >
            退出
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
