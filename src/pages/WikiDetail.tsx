import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Star } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";
import StatusBadge from "../components/knowledge/StatusBadge";
import ReviewPanel from "../components/knowledge/ReviewPanel";
import PermissionEditor from "../components/knowledge/PermissionEditor";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function WikiDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const [showPerms, setShowPerms] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["knowledge", id],
    queryFn: () => api(`/api/knowledge/${id}`),
    enabled: !!id,
  });

  const obj = data?.object;
  const isFavorited = data?.isFavorited ?? false;
  const versions = data?.versions ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      api(`/api/knowledge/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => { setEditing(false); refetch(); },
  });

  const favMut = useMutation({
    mutationFn: () => {
      const method = isFavorited ? "DELETE" : "POST";
      return api(`/api/knowledge/${id}/favorite`, { method });
    },
    onSuccess: () => refetch(),
  });

  if (isLoading) return <div className="p-8 text-slate-400">加载中…</div>;
  if (!obj) return <div className="p-8 text-slate-500">未找到该 Wiki 条目</div>;

  const isOwner = user?.id === obj.ownerId;
  const isReviewer = user?.id === obj.reviewerId;

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
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => favMut.mutate()} disabled={favMut.isPending}
            className={`px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1 ${isFavorited ? "text-yellow-500 border-yellow-300" : ""}`}>
            <Star className={`h-3.5 w-3.5 ${isFavorited ? "fill-yellow-400" : ""}`} />
            {isFavorited ? "已收藏" : "收藏"}
          </button>
          <button onClick={() => { setContent(obj.description ?? ""); setEditing(true); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50">
            <Pencil className="h-3.5 w-3.5" />编辑
          </button>
          <button onClick={() => setShowPerms(true)} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50">权限</button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            className="w-full min-h-[300px] p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
            placeholder="输入 Markdown 内容…" />
          <div className="flex gap-3">
            <button onClick={() => saveMutation.mutate({ description: content })} disabled={saveMutation.isPending}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saveMutation.isPending ? "保存中…" : "保存"}
            </button>
            <button onClick={() => setEditing(false)} className="px-5 py-2 border rounded-lg text-sm hover:bg-slate-50">取消</button>
          </div>
        </div>
      ) : (
        obj.description && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <div className="prose max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">{obj.description}</div>
          </div>
        )
      )}

      {obj.tags?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {obj.tags.map((t: string) => (<span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{t}</span>))}
        </div>
      )}

      {versions.length > 1 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">版本历史</h2>
          <div className="space-y-1">
            {versions.map((v: any) => (
              <Link key={v.id} to={`/wiki/${v.id}`}
                className={`flex items-center justify-between px-4 py-2 rounded-lg border text-sm ${v.id === id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-slate-50"}`}>
                <span className="font-medium">v{v.version}</span>
                <StatusBadge status={v.status} />
                <span className="text-xs text-slate-400">{new Date(v.updatedAt).toLocaleDateString("zh-CN")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ReviewPanel objectId={id!} status={obj.status} userRole={user?.role ?? "viewer"} isOwner={isOwner} isReviewer={isReviewer} />

      {showPerms && <PermissionEditor objectId={id!} onClose={() => setShowPerms(false)} />}
    </div>
  );
}
