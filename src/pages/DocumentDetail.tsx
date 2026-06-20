import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import FilePreview from "../components/common/FilePreview";

async function api(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  published: { label: "已发布", cls: "bg-success-light text-success" },
  draft: { label: "草稿", cls: "bg-slate-100 text-slate-500" },
  pending_review: { label: "审核中", cls: "bg-warning-light text-warning" },
  archived: { label: "已归档", cls: "bg-danger-light text-danger" },
};

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [previewFile, setPreviewFile] = useState<{ filePath: string; fileName: string; downloadUrl: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge", id],
    queryFn: () => api(`/api/knowledge/${id}`),
    enabled: !!id,
  });

  const obj = data?.object;
  const versions = data?.versions ?? [];

  if (isLoading) return <div className="px-8 py-7 text-text-muted">加载中…</div>;
  if (!obj) return <div className="px-8 py-7 text-danger">文档不存在</div>;

  const sc = statusConfig[obj.status] ?? { label: obj.status, cls: "" };

  return (
    <div className="px-8 py-7 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex gap-1.5 items-center text-[13px] text-text-muted mb-5">
        <Link to="/" className="text-accent hover:underline">工作台</Link>
        <span>/</span>
        <span>{obj.spaceName ?? "—"}</span>
        <span>/</span>
        <span className="text-text">{obj.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold mb-2">{obj.title}</h2>
        <div className="flex flex-wrap gap-4 text-[13px] text-text-muted">
          <span>作者：{obj.ownerName ?? "—"}</span>
          <span>版本：v{obj.version}</span>
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", sc.cls)}>{sc.label}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn btn-primary btn-sm">预览</button>
          <button className="btn btn-sm">下载</button>
          <button className="btn btn-sm">编辑</button>
          <button className="btn btn-sm ml-auto text-danger border-danger-light">删除</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-border mb-5">
        {["基本信息", "版本历史"].map((t, i) => (
          <button key={t} className={cn("px-5 py-2 text-sm -mb-0.5 transition-colors", i === 0 ? "text-accent border-b-2 border-accent font-semibold" : "text-text-muted hover:text-text")}>{t}</button>
        ))}
      </div>

      {/* Description */}
      <div className="bg-card-bg border border-border rounded-lg p-5 mb-5">
        <h3 className="text-[15px] font-semibold mb-3">文档说明</h3>
        <p className="text-sm leading-relaxed">{obj.description || "暂无说明"}</p>
      </div>

      {/* Attachments */}
      <div className="bg-card-bg border border-border rounded-lg p-5 mb-5">
        <h3 className="text-[15px] font-semibold mb-3">附件文件</h3>
        {obj.filePath ? (
          <div className="flex items-center bg-page-bg border border-border rounded-lg px-4 py-2.5">
            <span className="text-sm font-medium flex-1 truncate">{obj.fileName ?? obj.filePath.split("/").pop()}</span>
            <button className="btn btn-sm text-xs" onClick={() => setPreviewFile({ filePath: obj.filePath, fileName: obj.fileName ?? "文件", downloadUrl: `/api/drive/download?path=${encodeURIComponent(obj.filePath)}` })}>预览</button>
            <a href={`/api/drive/download?path=${encodeURIComponent(obj.filePath)}`} className="btn btn-sm text-xs ml-1">下载</a>
          </div>
        ) : (
          <p className="text-sm text-text-muted">暂无附件</p>
        )}
      </div>

      {/* Version History */}
      <div className="bg-card-bg border border-border rounded-lg p-5">
        <h3 className="text-[15px] font-semibold mb-3">版本历史</h3>
        {versions.length === 0 ? (
          <p className="text-sm text-text-muted">暂无历史版本</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">版本</th>
                <th className="text-left px-3 py-2 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">状态</th>
                <th className="text-left px-3 py-2 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-border">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v: any) => {
                const vs = statusConfig[v.status] ?? { label: v.status, cls: "" };
                return (
                  <tr key={v.id} className="hover:bg-card-hover transition-colors">
                    <td className="px-3 py-2 font-semibold border-b border-border">v{v.version}</td>
                    <td className="px-3 py-2 border-b border-border"><span className={cn("text-[11px] px-1.5 py-0.5 rounded", vs.cls)}>{vs.label}</span></td>
                    <td className="px-3 py-2 text-text-muted border-b border-border">{new Date(v.updatedAt).toLocaleString("zh-CN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {previewFile && <FilePreview open {...previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}
