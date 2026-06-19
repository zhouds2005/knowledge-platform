import { Folder, File as FileIcon } from "lucide-react";

interface FileItem {
  name: string;
  isDir: boolean;
  size: number;
  lastModified: string;
}

interface FileListProps {
  files: FileItem[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("zh-CN");
  } catch {
    return iso;
  }
}

export default function FileList({ files, currentPath = "/", onNavigate }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">此目录为空</p>
      </div>
    );
  }

  // Sort: directories first, then alphabetically
  const sorted = [...files].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <ul className="space-y-1">
      {sorted.map((f, i) => {
        const fullPath = (currentPath.endsWith("/") ? currentPath : currentPath + "/") + f.name;
        return (
          <li
            key={i}
            className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border text-sm ${f.isDir && onNavigate ? "cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors" : ""}`}
            onClick={() => f.isDir && onNavigate?.(fullPath)}
          >
            {f.isDir ? (
              <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
            ) : (
              <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />
            )}
            <span className="flex-1 truncate font-medium">{f.name}</span>
            {!f.isDir && (
              <>
                <span className="text-xs text-slate-400 shrink-0 w-16 text-right">{formatSize(f.size)}</span>
                <span className="text-xs text-slate-400 shrink-0 w-24 text-right">{formatDate(f.lastModified)}</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
