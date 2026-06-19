import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

const typeLabels: Record<string, string> = {
  review_requested: "审核任务",
  review_approved: "审核通过",
  review_rejected: "审核驳回",
  new_version: "文档更新",
  mentioned: "提及",
};

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => api("/api/notifications") });
  const notifications = data?.notifications ?? [];

  const markMut = useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}/read`, { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => api("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="px-8 py-7 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-bold">通知中心</h2>
        <button onClick={() => markAllMut.mutate()} className="btn btn-sm text-xs">全部标为已读</button>
      </div>

      {isLoading ? (
        <p className="text-text-muted">加载中…</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16"><p className="text-text-muted">暂无通知</p></div>
      ) : (
        <div className="space-y-0.5">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.read && markMut.mutate(n.id)}
              className={cn(
                "flex items-start gap-3 px-3.5 py-3 rounded-md cursor-pointer transition-colors",
                n.read ? "" : "bg-accent-light"
              )}
            >
              {!n.read && <span className="w-2 h-2 bg-accent rounded-full mt-[7px] shrink-0" />}
              <div className={cn("flex-1", n.read && "ml-5")}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-accent">{typeLabels[n.type] ?? n.type}</span>
                  {n.objectId ? (
                    <Link to={`/knowledge/${n.objectId}`} className="text-sm font-medium hover:text-accent">{n.message}</Link>
                  ) : (
                    <span className="text-sm">{n.message}</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("zh-CN")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
