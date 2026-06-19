import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function NotificationBell() {
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: () => api("/api/notifications"), refetchInterval: 30000 });
  const unread = data?.unreadCount ?? 0;

  return (
    <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
      <Bell className="h-5 w-5 text-slate-600" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
