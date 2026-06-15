import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "../../hooks/usePermissions";

interface UserItem {
  id: string;
  name: string;
  email: string;
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error("Failed: " + res.status);
  return res.json();
}

interface Props {
  objectId: string;
  onClose: () => void;
}

export default function PermissionEditor({ objectId, onClose }: Props) {
  const { grants, updatePermissions } = usePermissions(objectId);
  const [entries, setEntries] = useState<{ granteeId: string; permission: string }[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [newPerm, setNewPerm] = useState("view");

  // 获取用户列表
  const { data: userData } = useQuery({
    queryKey: ["users", "list"],
    queryFn: () => api("/api/users/list"),
  });
  const userList: UserItem[] = userData?.users ?? [];

  function addGrant() {
    if (!newUserId) return;
    // 去重
    if (entries.some(e => e.granteeId === newUserId)) return;
    const user = userList.find(u => u.id === newUserId);
    setEntries([...entries, { granteeId: newUserId, permission: newPerm }]);
    setNewUserId("");
  }

  function removeGrant(idx: number) {
    setEntries(entries.filter((_, i) => i !== idx));
  }

  function save() {
    const payload = entries.map((e) => ({
      granteeType: "user",
      granteeId: e.granteeId,
      permission: e.permission,
    }));
    updatePermissions(payload);
    onClose();
  }

  // 根据 ID 查找用户名
  function userName(id: string) {
    const u = userList.find(u => u.id === id);
    return u ? u.name + " (" + u.email + ")" : id;
  }

  const permLabel: Record<string, string> = { view: "查看", edit: "编辑", review: "审核" };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">权限管理</h3>

        <div className="flex gap-2 mb-4">
          <select
            value={newUserId}
            onChange={e => setNewUserId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">选择用户…</option>
            {userList.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <select value={newPerm} onChange={e => setNewPerm(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="view">查看</option>
            <option value="edit">编辑</option>
            <option value="review">审核</option>
          </select>
          <button onClick={addGrant} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">添加</button>
        </div>

        <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
          {entries.map((e, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded text-sm">
              <span className="truncate">{userName(e.granteeId)}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">{permLabel[e.permission] ?? e.permission}</span>
                <button onClick={() => removeGrant(i)} className="text-red-500 text-xs">移除</button>
              </div>
            </li>
          ))}
        </ul>

        {grants.length > 0 && (
          <p className="text-xs text-slate-400 mb-4">当前已有 {grants.length} 条授权（保存后将覆盖）</p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">取消</button>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}
