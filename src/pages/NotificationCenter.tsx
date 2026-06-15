import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const typeLabels: Record<string, string> = {
  review_requested: "待审核",
  review_approved: "审核通过",
  review_rejected: "审核驳回",
  new_version: "新版本",
  mentioned: "@提及",
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

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">通知中心</h1>
      {isLoading ? (
        <p className="text-slate-400">加载中…</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16"><p className="text-slate-400">暂无通知</p></div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n: any) => (
            <li key={n.id} className={`px-4 py-3 rounded-xl border flex items-center justify-between ${n.read ? "bg-white" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600">{typeLabels[n.type] ?? n.type}</span>
                  {n.objectId && <Link to={`/knowledge/${n.objectId}`} className="text-sm text-slate-700 hover:text-blue-600">{n.message}</Link>}
                  {!n.objectId && <span className="text-sm text-slate-700">{n.message}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("zh-CN")}</p>
              </div>
              {!n.read && (
                <button onClick={() => markMut.mutate(n.id)} className="text-xs text-blue-600 hover:text-blue-700 ml-3">
                  标为已读
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
