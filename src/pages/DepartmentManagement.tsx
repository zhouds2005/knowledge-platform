import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["departments"], queryFn: () => api("/api/departments") });
  const deps = data?.departments ?? [];

  const createMut = useMutation({
    mutationFn: (name: string) => api("/api/departments", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments"] }); setNewName(""); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
    onError: (err: Error) => alert(err.message),
  });

  return (
    <div className="px-8 py-7 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-bold">部门管理</h2>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="新部门名称"
            className="px-3 py-2 border border-border rounded-lg text-sm bg-card-bg outline-none focus:border-accent"
          />
          <button onClick={() => newName && createMut.mutate(newName)} className="btn btn-primary">创建</button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-text-muted">加载中…</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3.5 py-2.5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">部门名称</th>
              <th className="text-left px-3.5 py-2.5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">创建时间</th>
              <th className="text-right px-3.5 py-2.5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">操作</th>
            </tr>
          </thead>
          <tbody>
            {deps.map((d: any) => (
              <tr key={d.id} className="hover:bg-card-hover transition-colors">
                <td className="px-3.5 py-2.5 font-semibold border-b border-border">{d.name}</td>
                <td className="px-3.5 py-2.5 text-text-muted border-b border-border">{new Date(d.createdAt).toLocaleDateString("zh-CN")}</td>
                <td className="px-3.5 py-2.5 text-right border-b border-border">
                  <button onClick={() => deleteMut.mutate(d.id)} className="text-xs text-danger hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
