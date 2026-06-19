import { useState, useEffect } from "react";

interface Department {
  id: string;
  name: string;
}

interface SpaceFormData {
  name: string;
  description: string;
  departmentId: string;
  defaultReviewerId: string;
  autoPublish: boolean;
}

interface SpaceFormProps {
  initial?: Partial<SpaceFormData>;
  departments: Department[];
  onSave: (data: SpaceFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

const emptyForm: SpaceFormData = { name: "", description: "", departmentId: "", defaultReviewerId: "", autoPublish: false };

export default function SpaceForm({ initial, departments, onSave, onCancel, saving }: SpaceFormProps) {
  const [form, setForm] = useState<SpaceFormData>({ ...emptyForm, ...initial });

  useEffect(() => { setForm({ ...emptyForm, ...initial }); }, [initial]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.departmentId) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onCancel}>
      <form className="bg-card-bg rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h3 className="font-serif text-lg font-semibold mb-4">{initial?.name ? "编辑空间" : "创建空间"}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">空间名称</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：技术部文档库" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg outline-none focus:border-accent" required />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">描述</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="空间用途说明" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg outline-none focus:border-accent resize-none" rows={2} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">所属部门</label>
            <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg" required>
              <option value="">选择部门</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.autoPublish} onChange={e => setForm(f => ({ ...f, autoPublish: e.target.checked }))} />
            <span>自动发布（无需审核）</span>
          </label>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button type="button" onClick={onCancel} className="btn btn-sm" disabled={saving}>取消</button>
          <button type="submit" className="btn btn-primary btn-sm disabled:opacity-50" disabled={saving}>{saving ? "保存中…" : "保存"}</button>
        </div>
      </form>
    </div>
  );
}
