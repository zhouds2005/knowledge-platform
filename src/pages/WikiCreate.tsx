import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function WikiCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [spaceId, setSpaceId] = useState("");

  const { data: spacesResp } = useQuery({ queryKey: ["spaces"], queryFn: () => api("/api/spaces") });
  const spaces = spacesResp?.spaces ?? [];

  const createMut = useMutation({
    mutationFn: () => api("/api/knowledge", {
      method: "POST",
      body: JSON.stringify({
        type: "wiki",
        title,
        description: content,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        spaceId,
        visibility: "space",
        sourceTable: "wiki_pages",
        sourceId: crypto.randomUUID(),
      }),
    }),
    onSuccess: (data) => navigate(`/knowledge/${data.object.id}`),
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">创建 Wiki</h1>
      <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">内容（Markdown）</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">知识空间</label>
          <select value={spaceId} onChange={e => setSpaceId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">选择空间</option>
            {spaces.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={createMut.isPending} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {createMut.isPending ? "创建中…" : "创建 Wiki"}
        </button>
      </form>
    </div>
  );
}
