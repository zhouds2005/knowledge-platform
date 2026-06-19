import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RichEditor from "../components/wiki/RichEditor";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function WikiEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["knowledge", id], queryFn: () => api(`/api/knowledge/${id}`), enabled: !!id });
  const obj = data?.object;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (obj) { setTitle(obj.title); setContent(obj.description ?? ""); setTags((obj.tags ?? []).join(", ")); }
  }, [obj]);

  const updateMut = useMutation({
    mutationFn: () => api(`/api/knowledge/${id}`, { method: "PUT", body: JSON.stringify({ title, description: content, tags: tags.split(",").map(t => t.trim()).filter(Boolean) }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["knowledge"] }); navigate(`/knowledge/${id}`); },
  });

  if (!obj) return <div className="px-8 py-7 text-text-muted">加载中…</div>;
  if (obj.type !== "wiki") return <div className="px-8 py-7 text-text-muted">只能编辑 Wiki 条目</div>;

  return (
    <div className="max-w-3xl mx-auto px-8 py-7">
      <h2 className="font-serif text-xl font-bold mb-6">编辑 Wiki</h2>
      <form onSubmit={e => { e.preventDefault(); updateMut.mutate(); }} className="space-y-4">
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card-bg outline-none focus:border-accent" />
        <RichEditor content={content} onChange={setContent} placeholder="请输入 Wiki 内容..." />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="标签（逗号分隔）" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card-bg outline-none focus:border-accent" />
        <button type="submit" disabled={updateMut.isPending} className="btn btn-primary">{updateMut.isPending ? "保存中…" : "保存"}</button>
      </form>
    </div>
  );
}
