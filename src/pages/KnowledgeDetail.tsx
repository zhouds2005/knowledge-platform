import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Search, GitGraph } from "lucide-react";
import StatusBadge from "../components/knowledge/StatusBadge";
import ReviewPanel from "../components/knowledge/ReviewPanel";
import PermissionEditor from "../components/knowledge/PermissionEditor";
import KnowledgeGraph from "../components/graph/KnowledgeGraph";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showPerms, setShowPerms] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [attachQ, setAttachQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge", id], queryFn: () => api(`/api/knowledge/${id}`), enabled: !!id,
  });

  const { data: graphData } = useQuery({
    queryKey: ["knowledge", id, "graph"], queryFn: () => api(`/api/knowledge/${id}/graph`), enabled: !!id,
  });

  const { data: searchRes } = useQuery({
    queryKey: ["knowledge", "attach", attachQ],
    queryFn: () => api(`/api/knowledge/search?q=${encodeURIComponent(attachQ)}`),
    enabled: showAttach && attachQ.length > 0,
  });

  const attachMut = useMutation({
    mutationFn: (targetId: string) => api(`/api/knowledge/${id}/relation`, { method: "POST", body: JSON.stringify({ targetId, relationType: "references" }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["knowledge", id, "graph"] }); setShowAttach(false); },
  });

  const obj = data?.object;
  const versions = data?.versions ?? [];
  const graphNodes = graphData?.nodes ?? [];
  const graphEdges = graphData?.edges ?? [];
  const related = graphNodes.filter((n: any) => n.id !== id);

  if (isLoading) return <div className="p-8 text-slate-400">加载中…</div>;
  if (!obj) return <div className="p-8 text-slate-500">未找到该知识对象</div>;

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{obj.title}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>类型：{obj.type}</span><span>·</span><StatusBadge status={obj.status} /><span>·</span><span>版本 {obj.version}</span><span>·</span><span>{obj.viewCount} 次浏览</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {obj.type === "wiki" && <Link to={`/knowledge/${id}/edit`} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50">编辑</Link>}
          {related.length > 0 && (
            <button onClick={() => setShowGraph(!showGraph)} className={`px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1 ${showGraph ? "bg-blue-50 border-blue-200 text-blue-700" : ""}`}>
              <GitGraph className="h-3.5 w-3.5" />图谱
            </button>
          )}
          <button onClick={() => setShowAttach(true)} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />关联</button>
          <button onClick={() => setShowPerms(true)} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50">权限</button>
        </div>
      </div>

      {/* Knowledge Graph */}
      {showGraph && related.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">知识图谱</h2>
          <KnowledgeGraph nodes={graphNodes} edges={graphEdges} />
        </div>
      )}

      {obj.description && <div className="bg-white rounded-xl border p-6 mb-6"><p className="text-slate-700 whitespace-pre-wrap">{obj.description}</p></div>}
      {obj.tags?.length > 0 && <div className="flex gap-2 flex-wrap mb-6">{obj.tags.map((t: string) => (<span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{t}</span>))}</div>}

      {versions.length > 1 && (
        <div className="mb-6"><h2 className="text-sm font-semibold text-slate-700 mb-3">版本历史</h2>
          <div className="space-y-1">{versions.map((v: any) => (<Link key={v.id} to={`/knowledge/${v.id}`} className={`flex items-center justify-between px-4 py-2 rounded-lg border text-sm ${v.id === id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-slate-50"}`}><span className="font-medium">v{v.version}</span><StatusBadge status={v.status} /><span className="text-xs text-slate-400">{new Date(v.updatedAt).toLocaleDateString("zh-CN")}</span></Link>))}</div>
        </div>
      )}

      {!showGraph && related.length > 0 && (
        <div className="mb-6"><h2 className="text-sm font-semibold text-slate-700 mb-3">关联内容</h2>
          <div className="space-y-2">{related.map((n: any) => (<Link key={n.id} to={`/knowledge/${n.id}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border hover:border-blue-200"><span className={`text-xs px-2 py-0.5 rounded-full ${n.type==="document"?"bg-blue-100 text-blue-700":n.type==="wiki"?"bg-green-100 text-green-700":"bg-orange-100 text-orange-700"}`}>{n.type}</span><span className="text-sm font-medium text-slate-800">{n.title}</span></Link>))}</div>
        </div>
      )}

      <ReviewPanel objectId={id!} status={obj.status} />

      {/* Attach modal */}
      {showAttach && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAttach(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">添加关联</h3>
            <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input value={attachQ} onChange={e => setAttachQ(e.target.value)} placeholder="搜索文档、Wiki、网盘文件…" className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {(searchRes?.objects ?? []).filter((o: any) => o.id !== id).map((o: any) => (<button key={o.id} onClick={() => attachMut.mutate(o.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm border"><span className="font-medium">{o.title}</span><span className="text-xs text-slate-400 ml-2">{o.type}</span></button>))}
            </div>
          </div>
        </div>
      )}
      {showPerms && <PermissionEditor objectId={id!} onClose={() => setShowPerms(false)} />}
    </div>
  );
}
