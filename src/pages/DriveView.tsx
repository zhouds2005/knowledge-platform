import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import FileList from "../components/drive/FileList";
import UploadButton from "../components/drive/UploadButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", ...options });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function DriveView() {
  const [currentPath, setCurrentPath] = useState("/");
  const [pathStack, setPathStack] = useState<string[]>(["/"]);

  const { data, isLoading } = useQuery({
    queryKey: ["drive", "list", currentPath],
    queryFn: () => api(`/api/drive/list?path=${encodeURIComponent(currentPath)}`),
  });

  function navigateTo(path: string) {
    setPathStack(prev => [...prev, path]);
    setCurrentPath(path);
  }

  function goBack() {
    if (pathStack.length <= 1) return;
    const newStack = pathStack.slice(0, -1);
    setPathStack(newStack);
    setCurrentPath(newStack[newStack.length - 1]);
  }

  const files = data?.files ?? [];
  const isRoot = pathStack.length <= 1;

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">网盘文件</h1>
          {!isRoot && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
              返回上级
            </button>
          )}
        </div>
        <UploadButton path={currentPath} disabled={isLoading} />
      </div>

      {!isRoot && (
        <p className="text-xs text-slate-400 mb-3 truncate">{currentPath}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">加载中…</p>
      ) : files.length === 0 && isRoot ? (
        <div className="text-center py-16">
          <p className="text-slate-400">网盘为空或 Nextcloud 未连接</p>
          <p className="text-xs text-slate-400 mt-1">点击右上角上传第一个文件</p>
        </div>
      ) : (
        <FileList files={files} currentPath={currentPath} onNavigate={navigateTo} />
      )}
    </div>
  );
}
