import { useState } from "react";
import { usePermissions } from "../../hooks/usePermissions";

interface Props {
  objectId: string;
  onClose: () => void;
}

export default function PermissionEditor({ objectId, onClose }: Props) {
  const { grants, updatePermissions } = usePermissions(objectId);
  const [entries, setEntries] = useState<{ granteeId: string; permission: string }[]>([]);
  const [newId, setNewId] = useState("");
  const [newPerm, setNewPerm] = useState("view");

  function addGrant() {
    if (!newId) return;
    const updated = [...entries, { granteeId: newId, permission: newPerm }];
    setEntries(updated);
    setNewId("");
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

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">权限管理</h3>

        <div className="flex gap-2 mb-4">
          <input
            value={newId}
            onChange={e => setNewId(e.target.value)}
            placeholder="用户 ID"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
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
              <span>{e.granteeId}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{e.permission}</span>
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
