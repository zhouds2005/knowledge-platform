import { useState } from "react";
import { X, Download } from "lucide-react";

interface FilePreviewProps {
  open: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
  downloadUrl: string;
}

export default function FilePreview({ open, onClose, filePath, fileName, downloadUrl }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);

  if (!open) return null;

  const isOffice = /\.(docx?|xlsx?|pptx?|od[tsp])$/i.test(fileName);
  const previewUrl = isOffice
    ? `/api/preview/office?path=${encodeURIComponent(filePath)}`
    : `/api/preview/raw?path=${encodeURIComponent(filePath)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card-bg rounded-lg w-[90vw] h-[85vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h3 className="font-semibold text-sm truncate">{fileName}</h3>
          <div className="flex gap-2">
            <a href={downloadUrl} download className="btn btn-sm text-xs gap-1">
              <Download className="w-3.5 h-3.5" /> 下载
            </a>
            <button onClick={onClose} className="text-text-muted hover:text-text">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full text-text-muted text-sm">
              {isOffice ? "正在转换格式…" : "加载中…"}
            </div>
          )}
          <iframe src={previewUrl} onLoad={() => setLoading(false)} className="w-full h-full border-0" />
        </div>
      </div>
    </div>
  );
}
