import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../providers/AuthProvider";
import { cn } from "../lib/utils";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

const roleConfig: Record<string, string> = {
  admin: "bg-accent-light text-accent",
  editor: "bg-warning-light text-warning",
  reviewer: "bg-warning-light text-warning",
  viewer: "bg-slate-100 text-slate-500",
};

const roleLabels: Record<string, string> = {
  admin: "管理员", editor: "编辑者", reviewer: "审核员", viewer: "普通用户",
};

export default function UserManagement() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [deptId, setDeptId] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => api("/api/users") });
  const users = data?.users ?? [];
  const { data: deptData } = useQuery({ queryKey: ["departments"], queryFn: () => api("/api/departments") });
  const depts = deptData?.departments ?? [];

  const createMut = useMutation({
    mutationFn: () => api("/api/users", { method: "POST", body: JSON.stringify({ name, email, password, role, departmentId: deptId || null }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setShowForm(false); setName(""); setEmail(""); setPassword(""); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  if (user?.role !== "admin") return <div className="px-8 py-7 text-danger">仅管理员可访问</div>;

  return (
    <div className="px-8 py-7 max-w-7xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-bold">用户管理</h2>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">+ 添加用户</button>
      </div>

      {isLoading ? <p className="text-sm text-text-muted">加载中…</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3.5 py-2.5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">姓名</th>
              <th className="text-left px-3.5 py-2.5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">邮箱</th>
              <th className="text-left px-3.5 py-2.5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">角色</th>
              <th className="text-right px-3.5 py-2.5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-card-hover transition-colors">
                <td className="px-3.5 py-2.5 font-semibold border-b border-border">{u.name}</td>
                <td className="px-3.5 py-2.5 text-text-muted border-b border-border">{u.email}</td>
                <td className="px-3.5 py-2.5 border-b border-border">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", roleConfig[u.role] ?? "bg-slate-100 text-slate-500")}>
                    {roleLabels[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-right border-b border-border">
                  <button onClick={() => deleteMut.mutate(u.id)} className="text-xs text-danger hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-card-bg rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-semibold mb-4">添加用户</h3>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg outline-none focus:border-accent" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" type="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg outline-none focus:border-accent" />
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" type="password" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg outline-none focus:border-accent" />
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg">
                <option value="viewer">普通用户</option><option value="editor">编辑者</option><option value="admin">管理员</option>
              </select>
              <select value={deptId} onChange={e => setDeptId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg">
                <option value="">选择部门</option>
                {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowForm(false)} className="btn btn-sm">取消</button>
              <button onClick={() => createMut.mutate()} className="btn btn-primary btn-sm">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
