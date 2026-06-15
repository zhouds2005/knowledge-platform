import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../providers/AuthProvider";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

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

  if (user?.role !== "admin") return <div className="p-6 text-red-500">仅管理员可访问</div>;

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">添加用户</button>
      </div>

      {isLoading ? <p className="text-slate-400">加载中…</p> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left px-4 py-3">名称</th><th className="text-left px-4 py-3">邮箱</th><th className="text-left px-4 py-3">角色</th><th className="text-right px-4 py-3">操作</th></tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{u.role}</span></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => deleteMut.mutate(u.id)} className="text-xs text-red-500 hover:text-red-700">删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">添加用户</h3>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" type="email" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" type="password" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="viewer">viewer</option><option value="editor">editor</option><option value="admin">admin</option>
              </select>
              <select value={deptId} onChange={e => setDeptId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">选择部门</option>
                {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">取消</button>
              <button onClick={() => createMut.mutate()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
