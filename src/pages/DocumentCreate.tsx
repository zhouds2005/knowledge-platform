import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function DocumentCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [spaceId, setSpaceId] = useState("");

  const { data: spacesResp } = useQuery({ queryKey: ["spaces"], queryFn: () => api("/api/spaces") });
  const spaces = spacesResp?.spaces ?? [];

  const createMut = useMutation({
    mutationFn: () => api("/api/knowledge", {
      method: "POST",
      body: JSON.stringify({
        type: "document",
        title,
        description,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        spaceId,
        visibility: "space",
        sourceTable: "documents",
        sourceId: crypto.randomUUID(),
      }),
    }),
    onSuccess: (data) => navigate(`/knowledge/${data.object.id}`),
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">创建文档</h1>
      <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">内容</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="合同, 2025, 技术" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">知识空间</label>
          <select value={spaceId} onChange={e => setSpaceId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">选择空间</option>
            {spaces.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={createMut.isPending} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {createMut.isPending ? "创建中…" : "创建文档"}
        </button>
      </form>
    </div>
  );
}
