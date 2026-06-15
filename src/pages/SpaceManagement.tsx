import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";
import SpaceCard from "../components/space/SpaceCard";
import SpaceForm from "../components/space/SpaceForm";

interface Space {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  defaultReviewerId: string | null;
  autoPublish: boolean;
}

interface Department {
  id: string;
  name: string;
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function SpaceManagement() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: spacesData, isLoading } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => api("/api/spaces"),
  });
  const spaces: Space[] = spacesData?.spaces ?? [];

  const { data: deptData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api("/api/departments"),
  });
  const departments: Department[] = deptData?.departments ?? [];

  const createMut = useMutation({
    mutationFn: (body: { name: string; departmentId: string; description?: string; autoPublish?: boolean }) =>
      api("/api/spaces", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["spaces"] }); setShowCreate(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name: string; description?: string; autoPublish?: boolean }) =>
      api(`/api/spaces/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["spaces"] }); setEditingId(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/spaces/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spaces"] }),
  });

  const editingSpace = editingId ? spaces.find(s => s.id === editingId) : null;

  if (user?.role !== "admin") {
    return <div className="p-6 text-red-500">仅管理员可访问此页面</div>;
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">空间管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理所有知识空间，创建和编辑空间配置</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />创建空间
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">加载中…</p>
      ) : spaces.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400">暂无知识空间</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            创建第一个空间
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map(s => {
            const dept = departments.find(d => d.id === s.departmentId);
            return (
              <SpaceCard
                key={s.id}
                id={s.id}
                name={s.name}
                description={s.description}
                departmentName={dept?.name}
                autoPublish={s.autoPublish}
                onEdit={setEditingId}
                onDelete={(id) => { if (confirm("确认删除此空间？")) deleteMut.mutate(id); }}
              />
            );
          })}
        </div>
      )}

      {showCreate && (
        <SpaceForm
          departments={departments}
          onSave={(data) => createMut.mutate(data)}
          onCancel={() => setShowCreate(false)}
          saving={createMut.isPending}
        />
      )}

      {editingSpace && (
        <SpaceForm
          initial={{
            name: editingSpace.name,
            description: editingSpace.description ?? "",
            departmentId: editingSpace.departmentId,
            autoPublish: editingSpace.autoPublish,
          }}
          departments={departments}
          onSave={(data) => updateMut.mutate({ id: editingSpace.id, ...data })}
          onCancel={() => setEditingId(null)}
          saving={updateMut.isPending}
        />
      )}
    </div>
  );
}
