import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import StatusBadge from "../components/knowledge/StatusBadge";
import ReviewPanel from "../components/knowledge/ReviewPanel";
import PermissionEditor from "../components/knowledge/PermissionEditor";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [showPerms, setShowPerms] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge", id],
    queryFn: () => api(`/api/knowledge/${id}`),
    enabled: !!id,
  });

  const { data: graphData } = useQuery({
    queryKey: ["knowledge", id, "graph"],
    queryFn: () => api(`/api/knowledge/${id}/graph`),
    enabled: !!id,
  });

  const obj = data?.object;
  const versions = data?.versions ?? [];
  const related = (graphData?.nodes ?? []).filter((n: any) => n.id !== id);

  if (isLoading) return <div className="p-8 text-slate-400">加载中…</div>;
  if (!obj) return <div className="p-8 text-slate-500">未找到该文档</div>;

  return (
    <div className="px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />返回首页
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{obj.title}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <StatusBadge status={obj.status} />
            <span>·</span>
            <span>版本 {obj.version}</span>
            <span>·</span>
            <span>{obj.viewCount} 次浏览</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPerms(true)} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50">权限</button>
        </div>
      </div>

      {obj.description && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{obj.description}</p>
        </div>
      )}

      {obj.tags?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {obj.tags.map((t: string) => (
            <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
      )}

      {versions.length > 1 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">版本历史</h2>
          <div className="space-y-1">
            {versions.map((v: any) => (
              <Link
                key={v.id}
                to={`/documents/${v.id}`}
                className={`flex items-center justify-between px-4 py-2 rounded-lg border text-sm ${v.id === id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-slate-50"}`}
              >
                <span className="font-medium">v{v.version}</span>
                <StatusBadge status={v.status} />
                <span className="text-xs text-slate-400">{new Date(v.updatedAt).toLocaleDateString("zh-CN")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">关联内容</h2>
          <div className="space-y-2">
            {related.map((n: any) => (
              <Link key={n.id} to={`/knowledge/${n.id}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border hover:border-blue-200">
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.type === "document" ? "bg-blue-100 text-blue-700" : n.type === "wiki" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                  {n.type === "document" ? "文档" : n.type === "wiki" ? "Wiki" : "网盘"}
                </span>
                <span className="text-sm font-medium text-slate-800">{n.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ReviewPanel objectId={id!} status={obj.status} />

      {showPerms && <PermissionEditor objectId={id!} onClose={() => setShowPerms(false)} />}
    </div>
  );
}
