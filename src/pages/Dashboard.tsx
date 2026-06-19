import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "../providers/AuthProvider";
import SearchBar from "../components/knowledge/SearchBar";
import KnowledgeCard from "../components/knowledge/KnowledgeCard";
import KnowledgeGrid from "../components/knowledge/KnowledgeGrid";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function Dashboard() {
  const { user: _user } = useAuthContext();
  const [searchParams, setSearchParams] = useState<{ q: string; type: string } | null>(null);

  const { data: searchData, isLoading } = useQuery({
    queryKey: ["knowledge", "search", searchParams],
    queryFn: () => { const p = new URLSearchParams(); if (searchParams?.q) p.set("q", searchParams.q); if (searchParams?.type) p.set("type", searchParams.type); return api(`/api/knowledge/search?${p}`); },
    enabled: !!searchParams?.q,
  });

  const { data: recentData } = useQuery({
    queryKey: ["knowledge", "recent"],
    queryFn: () => api("/api/knowledge/search"),
    enabled: !searchParams?.q,
  });

  // Spaces for quick nav
  const { data: spacesData } = useQuery({ queryKey: ["spaces"], queryFn: () => api("/api/spaces") });
  const spaces = spacesData?.spaces ?? [];

  const objects = searchParams?.q ? (searchData?.objects ?? []) : (recentData?.objects ?? []);

  function handleSearch(q: string, type: string) { setSearchParams({ q: q || " ", type }); }

  return (
    <div className="px-6 py-8">
      <div className="mb-8"><SearchBar onSearch={handleSearch} /></div>

      {/* Quick space navigation */}
      {!searchParams?.q && spaces.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">知识空间</h2>
          <div className="flex gap-2 flex-wrap">
            {spaces.map((s: any) => (
              <Link key={s.id} to={`/space/${s.id}`} className="px-4 py-2 bg-white rounded-xl border text-sm hover:border-blue-300 hover:bg-blue-50 transition-colors">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {searchParams?.q ? (
        <h2 className="text-lg font-semibold text-slate-800 mb-4">搜索结果 ({objects.length})</h2>
      ) : (
        <h2 className="text-lg font-semibold text-slate-800 mb-4">最近更新</h2>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">搜索中…</p>
      ) : objects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400">{searchParams?.q ? "没有找到相关内容" : "知识空间为空"}</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link to="/documents/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建文档</Link>
            <Link to="/wiki/new" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">创建 Wiki</Link>
          </div>
        </div>
      ) : (
        <KnowledgeGrid>{objects.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}</KnowledgeGrid>
      )}
    </div>
  );
}
