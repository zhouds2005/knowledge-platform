import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StatCard from "../components/common/StatCard";
import { cn } from "../lib/utils";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

const typeConfig: Record<string, { label: string; cls: string }> = {
  document: { label: "文", cls: "bg-info-light text-info" },
  wiki: { label: "Wi", cls: "bg-success-light text-success" },
  drive_file: { label: "文", cls: "bg-warning-light text-warning" },
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  published: { label: "已发布", cls: "bg-success-light text-success" },
  draft: { label: "草稿", cls: "bg-slate-100 text-slate-500" },
  pending_review: { label: "审核中", cls: "bg-warning-light text-warning" },
  archived: { label: "已归档", cls: "bg-danger-light text-danger" },
};

export default function Dashboard() {
  const [search, setSearch] = useState("");

  const { data: recent } = useQuery({
    queryKey: ["knowledge", "recent"],
    queryFn: () => api("/api/knowledge/search"),
  });

  const { data: spaces } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => api("/api/spaces"),
  });

  const objects = recent?.objects ?? [];
  const spaceList = spaces?.spaces ?? [];

  const reviewCount = objects.filter((o: any) => o.status === "pending_review").length;

  return (
    <div className="px-8 py-7 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard label="知识总量" value={objects.length} sub="当前可见" colorClass="text-accent" />
        <StatCard label="空间数量" value={spaceList.length} sub={`${spaceList.filter((s: any) => s.autoPublish).length}个自动发布`} colorClass="text-info" />
        <StatCard label="待审核" value={reviewCount} sub={`${reviewCount > 0 ? '等待审核' : '暂无待审'}`} colorClass="text-warning" />
        <StatCard label="今日更新" value="—" sub="统计功能后续上线" colorClass="text-success" />
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索文档、Wiki、文件…"
        className="w-full max-w-[480px] border border-border rounded-lg px-4 py-2.5 text-sm bg-card-bg mb-7 outline-none focus:border-accent focus:ring-3 focus:ring-accent-light"
      />

      {/* Spaces */}
      {spaceList.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-serif text-lg font-semibold">我的空间</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {spaceList.map((s: any) => (
              <Link
                key={s.id}
                to={`/space/${s.id}`}
                className="px-4 py-1.5 bg-card-bg border border-border rounded-md text-[13px] hover:border-accent hover:bg-accent-light transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-serif text-lg font-semibold">最近更新</h2>
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted">知识空间为空</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link to="/documents/new" className="btn btn-primary">创建文档</Link>
            <Link to="/wiki/new" className="btn">创建 Wiki</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {objects.map((obj: any) => {
            const tc = typeConfig[obj.type] ?? { label: "?", cls: "bg-slate-100 text-slate-500" };
            const sc = statusConfig[obj.status] ?? { label: obj.status, cls: "" };
            return (
              <Link
                key={obj.id}
                to={`/knowledge/${obj.id}`}
                className="flex items-center bg-card-bg border border-border rounded-lg px-4 py-3 hover:border-accent transition-colors"
              >
                <span className={cn("w-9 h-9 rounded-md flex items-center justify-center text-[13px] font-semibold mr-3.5 shrink-0", tc.cls)}>
                  {tc.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{obj.title}</div>
                  <div className="text-xs text-text-muted truncate">
                    {obj.spaceName ?? "—"} · {new Date(obj.updatedAt).toLocaleDateString("zh-CN")}
                  </div>
                </div>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium ml-3 shrink-0", sc.cls)}>
                  {sc.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
