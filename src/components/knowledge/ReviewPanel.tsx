import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

interface Props { objectId: string; status: string; }

export default function ReviewPanel({ objectId, status }: Props) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const submitMut = useMutation({
    mutationFn: () => api(`/api/knowledge/${objectId}/submit`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }),
  });

  const withdrawMut = useMutation({
    mutationFn: () => api(`/api/knowledge/${objectId}/withdraw`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }),
  });

  const approveMut = useMutation({
    mutationFn: () => api(`/api/knowledge/${objectId}/approve`, { method: "POST" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }); queryClient.invalidateQueries({ queryKey: ["review"] }); },
  });

  const rejectMut = useMutation({
    mutationFn: () => api(`/api/knowledge/${objectId}/reject`, { method: "POST", body: JSON.stringify({ comment }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }); queryClient.invalidateQueries({ queryKey: ["review"] }); setComment(""); },
  });

  if (status === "draft") {
    return (
      <div className="mt-4">
        <button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {submitMut.isPending ? "提交中…" : "提交审核"}
        </button>
      </div>
    );
  }

  if (status === "pending_review") {
    return (
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <button onClick={() => approveMut.mutate()} disabled={approveMut.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">通过</button>
          <button onClick={() => rejectMut.mutate()} disabled={rejectMut.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">驳回</button>
          <button onClick={() => withdrawMut.mutate()} disabled={withdrawMut.isPending}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">撤回</button>
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="驳回理由（可选）" rows={2}
          className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
    );
  }

  return null;
}
