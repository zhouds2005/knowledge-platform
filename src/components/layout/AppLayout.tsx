import { Link, useLocation, Outlet } from "react-router-dom";
import { FileText, BookOpen, HardDrive, ClipboardCheck, LayoutDashboard, Building2, Users, Layers } from "lucide-react";
import { useAuthContext } from "../../providers/AuthProvider";
import NotificationBell from "../NotificationBell";

const navItems = [
  { to: "/", label: "首页", icon: LayoutDashboard },
  { to: "/documents/new", label: "文档", icon: FileText },
  { to: "/wiki/new", label: "Wiki", icon: BookOpen },
  { to: "/drive", label: "网盘", icon: HardDrive },
  { to: "/review", label: "审核", icon: ClipboardCheck },
];

export default function AppLayout() {
  const { user, logout } = useAuthContext();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-slate-100"><h1 className="text-sm font-bold text-slate-800">部门文件共享</h1></div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}><item.icon className="h-4 w-4" />{item.label}</Link>;
          })}
        </nav>
        {user?.role === "admin" && (
          <div className="px-3 pb-4 space-y-1">
            <Link to="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${pathname === "/admin/users" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}><Users className="h-4 w-4" />用户管理</Link>
            <Link to="/admin/departments" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${pathname === "/admin/departments" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}><Building2 className="h-4 w-4" />部门管理</Link>
            <Link to="/admin/spaces" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${pathname === "/admin/spaces" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}><Layers className="h-4 w-4" />空间管理</Link>
          </div>
        )}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-end gap-4 shrink-0">
          <NotificationBell />
          <span className="text-sm text-slate-600">{user?.name}</span>
          <button onClick={() => logout()} className="text-sm text-slate-400 hover:text-slate-600">退出</button>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
