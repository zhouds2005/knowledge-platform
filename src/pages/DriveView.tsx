import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderTree, Folder, File, ChevronRight, ChevronDown, HardDrive } from "lucide-react";
import FileList from "../components/drive/FileList";
import UploadButton from "../components/drive/UploadButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

interface SpaceNode {
  id: string;
  name: string;
  nextcloudPath: string | null;
}

// GET /api/departments returns { departments: [...] }
// GET /api/spaces returns { spaces: [...] }

export default function DriveView() {
  const [selectedSpace, setSelectedSpace] = useState<SpaceNode | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  // Fetch departments and spaces
  const { data: deptData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api("/api/departments"),
  });
  const { data: spaceData } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => api("/api/spaces"),
  });

  const departments = deptData?.departments ?? [];
  const spaces = spaceData?.spaces ?? [];

  // Build tree: departments → their spaces
  const tree = departments.map((d: any) => ({
    ...d,
    spaces: spaces.filter((s: any) => s.departmentId === d.id),
  })).filter((d: any) => d.spaces.length > 0);

  function toggleDept(deptId: string) {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar: department-space tree */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FolderTree className="h-4 w-4" />部门网盘
          </h2>
        </div>
        <div className="py-2">
          {tree.map((dept: any) => {
            const isExpanded = expandedDepts.has(dept.id);
            const isActive = selectedSpace && dept.spaces.some((s: any) => s.id === selectedSpace.id);
            return (
              <div key={dept.id}>
                <button
                  onClick={() => toggleDept(dept.id)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}
                >
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{dept.name}</span>
                </button>
                {isExpanded && dept.spaces.map((space: any) => (
                  <button
                    key={space.id}
                    onClick={() => setSelectedSpace(space)}
                    className={`w-full flex items-center gap-2 pl-10 pr-4 py-2 text-sm hover:bg-slate-50 ${selectedSpace?.id === space.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600"}`}
                  >
                    <File className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{space.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
          {tree.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">暂无部门或空间</p>
          )}
        </div>
      </aside>

      {/* Right: file list */}
      <main className="flex-1 overflow-y-auto">
        {!selectedSpace ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <HardDrive className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">请从左侧选择一个知识空间</p>
              <p className="text-sm text-slate-400 mt-1">文件将按部门和空间组织</p>
            </div>
          </div>
        ) : !selectedSpace.nextcloudPath ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-500">该空间尚未设置网盘路径</p>
              <p className="text-sm text-slate-400 mt-1">请先在空间管理中配置</p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">{selectedSpace.name}</h2>
              <UploadButton />
            </div>
            <FileList path={selectedSpace.nextcloudPath} />
          </div>
        )}
      </main>
    </div>
  );
}
