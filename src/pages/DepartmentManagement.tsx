import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../providers/AuthProvider";

interface Department {
  id: string;
  name: string;
  parentId: string | null;
}

interface Space {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  defaultReviewerId: string | null;
  autoPublish: boolean;
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function DepartmentManagement() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api("/api/departments"),
  });

  const deps: Department[] = data?.departments ?? [];

  const createMut = useMutation({
    mutationFn: (name: string) => api("/api/departments", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments"] }); setNewName(""); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const { data: spacesResp } = useQuery({ queryKey: ["spaces"], queryFn: () => api("/api/spaces") });
  const spaces: Space[] = spacesResp?.spaces ?? [];

  const createSpace = useMutation({
    mutationFn: (body: Partial<Space>) => api("/api/spaces", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spaces"] }),
  });

  const [spaceName, setSpaceName] = useState("");
  const [spaceDept, setSpaceDept] = useState("");

  if (user?.role !== "admin") {
    return <div className="p-6 text-red-500">仅管理员可访问此页面</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">部门 & 空间管理</h1>

      {/* Departments */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">部门</h2>
        <div className="flex gap-2 mb-4">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="新部门名称" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          <button onClick={() => newName && createMut.mutate(newName)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建</button>
        </div>
        {isLoading ? <p className="text-sm text-slate-400">加载中…</p> : (
          <ul className="space-y-1">
            {deps.map(d => (
              <li key={d.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border">
                <span className="text-sm">{d.name}</span>
                <button onClick={() => deleteMut.mutate(d.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Spaces */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">知识空间</h2>
        <div className="flex gap-2 mb-4">
          <input value={spaceName} onChange={e => setSpaceName(e.target.value)} placeholder="空间名称" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          <select value={spaceDept} onChange={e => setSpaceDept(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">选择部门</option>
            {deps.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={() => spaceName && spaceDept && createSpace.mutate({ name: spaceName, departmentId: spaceDept })} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建</button>
        </div>
        <ul className="space-y-1">
          {spaces.map(s => {
            const dept = deps.find(d => d.id === s.departmentId);
            return (
              <li key={s.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border">
                <div>
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-slate-400 ml-2">({dept?.name ?? s.departmentId})</span>
                </div>
                <span className="text-xs text-slate-400">{s.autoPublish ? "自动发布" : "需审核"}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
