import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || ("Request failed: " + res.status));
  }
  return res.json();
}

interface Props {
  objectId: string;
  status: string;
  userRole: string;
  isOwner: boolean;
  isReviewer: boolean;
}

export default function ReviewPanel({ objectId, status, userRole, isOwner, isReviewer }: Props) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  function clearError() { setError(null); }

  const submitMut = useMutation({
    mutationFn: () => api("/api/knowledge/" + objectId + "/submit", { method: "POST" }),
    onSuccess: () => { clearError(); queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }); },
    onError: (e: Error) => setError(e.message),
  });

  const withdrawMut = useMutation({
    mutationFn: () => api("/api/knowledge/" + objectId + "/withdraw", { method: "POST" }),
    onSuccess: () => { clearError(); queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }); },
    onError: (e: Error) => setError(e.message),
  });

  const approveMut = useMutation({
    mutationFn: () => api("/api/knowledge/" + objectId + "/approve", { method: "POST" }),
    onSuccess: () => { clearError(); queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }); queryClient.invalidateQueries({ queryKey: ["review"] }); },
    onError: (e: Error) => setError(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: () => api("/api/knowledge/" + objectId + "/reject", { method: "POST", body: JSON.stringify({ comment }) }),
    onSuccess: () => { clearError(); queryClient.invalidateQueries({ queryKey: ["knowledge", objectId] }); queryClient.invalidateQueries({ queryKey: ["review"] }); setComment(""); },
    onError: (e: Error) => setError(e.message),
  });

  const isAdmin = userRole === "admin";
  const canReview = isReviewer || isAdmin;

  if (status === "draft") {
    if (!isOwner && !isAdmin) return null;
    return (
      <div className="mt-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-2">{error}</p>}
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
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-2">
          {canReview && (
            <>
              <button onClick={() => approveMut.mutate()} disabled={approveMut.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">通过</button>
              <button onClick={() => rejectMut.mutate()} disabled={rejectMut.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">驳回</button>
            </>
          )}
          {(isOwner || isAdmin) && (
            <button onClick={() => withdrawMut.mutate()} disabled={withdrawMut.isPending}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">撤回</button>
          )}
        </div>
        {canReview && (
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="驳回理由（可选）" rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm" />
        )}
      </div>
    );
  }

  return null;
}
