import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function WikiEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["knowledge", id],
    queryFn: () => api(`/api/knowledge/${id}`),
    enabled: !!id,
  });

  const obj = data?.object;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (obj) {
      setTitle(obj.title);
      setContent(obj.description ?? "");
      setTags((obj.tags ?? []).join(", "));
    }
  }, [obj]);

  const updateMut = useMutation({
    mutationFn: () => api(`/api/knowledge/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, description: content, tags: tags.split(",").map(t => t.trim()).filter(Boolean) }),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["knowledge"] }); navigate(`/knowledge/${id}`); },
  });

  if (!obj) return <div className="p-8 text-slate-400">加载中…</div>;
  if (obj.type !== "wiki") return <div className="p-8 text-slate-500">只能编辑 Wiki 条目</div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">编辑 Wiki</h1>
      <form onSubmit={e => { e.preventDefault(); updateMut.mutate(); }} className="space-y-4">
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="标签（逗号分隔）" className="w-full px-3 py-2 border rounded-lg text-sm" />
        <button type="submit" disabled={updateMut.isPending} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {updateMut.isPending ? "保存中…" : "保存"}
        </button>
      </form>
    </div>
  );
}
