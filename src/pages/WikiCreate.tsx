import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import RichEditor from "../components/wiki/RichEditor";

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
      body: JSON.stringify({ type: "wiki", title, description: content, tags: tags.split(",").map(t => t.trim()).filter(Boolean), spaceId, visibility: "space", sourceTable: "wiki_pages", sourceId: crypto.randomUUID() }),
    }),
    onSuccess: (data) => navigate(`/knowledge/${data.object.id}`),
  });

  return (
    <div className="max-w-3xl mx-auto px-8 py-7">
      <h2 className="font-serif text-xl font-bold mb-6">创建 Wiki</h2>
      <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card-bg outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">内容</label>
          <RichEditor content={content} onChange={setContent} placeholder="请输入 Wiki 内容..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card-bg outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">知识空间</label>
          <select value={spaceId} onChange={e => setSpaceId(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card-bg">
            <option value="">选择空间</option>
            {spaces.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={createMut.isPending} className="btn btn-primary">{createMut.isPending ? "创建中…" : "创建 Wiki"}</button>
      </form>
    </div>
  );
}
