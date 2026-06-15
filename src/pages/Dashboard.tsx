import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "../providers/AuthProvider";
import { FileText, Clock, Star, ClipboardCheck, History } from "lucide-react";
import SearchBar from "../components/knowledge/SearchBar";
import KnowledgeCard from "../components/knowledge/KnowledgeCard";
import KnowledgeGrid from "../components/knowledge/KnowledgeGrid";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function SectionHeader({ icon: Icon, title, linkTo, linkLabel }: { icon: any; title: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
        <Icon className="h-4 w-4" />{title}
      </h2>
      <Link to={linkTo} className="text-xs text-blue-600 hover:text-blue-800">{linkLabel}</Link>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useState<{ q: string; type: string } | null>(null);

  // Search results (when searching)
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["knowledge", "search", searchParams],
    queryFn: () => {
      const p = new URLSearchParams();
      if (searchParams?.q) p.set("q", searchParams.q);
      if (searchParams?.type) p.set("type", searchParams.type);
      p.set("limit", "50");
      return api(`/api/knowledge/search?${p}`);
    },
    enabled: !!searchParams?.q,
  });

  // Recent updates (when not searching)
  const { data: recentData } = useQuery({
    queryKey: ["knowledge", "recent"],
    queryFn: () => api("/api/knowledge/search?limit=5"),
    enabled: !searchParams?.q,
  });

  // My drafts
  const { data: draftsData } = useQuery({
    queryKey: ["dashboard", "drafts"],
    queryFn: () => api(`/api/knowledge/search?owner_id=${user?.id}&status=draft&limit=5`),
    enabled: !!user && !searchParams?.q,
  });

  // Pending my review
  const { data: pendingData } = useQuery({
    queryKey: ["dashboard", "pending"],
    queryFn: () => api(`/api/knowledge/search?reviewer_id=${user?.id}&status=pending_review&limit=5`),
    enabled: !!user && !searchParams?.q,
  });

  // My favorites
  const { data: favData } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api("/api/favorites?limit=5"),
    enabled: !searchParams?.q,
  });

  // Browse history
  const { data: histData } = useQuery({
    queryKey: ["history"],
    queryFn: () => api("/api/history?limit=5"),
    enabled: !searchParams?.q,
  });

  const drafts = draftsData?.objects ?? [];
  const pending = pendingData?.objects ?? [];
  const favorites = favData?.objects ?? [];
  const history = histData?.objects ?? [];
  const recent = recentData?.objects ?? [];
  const searchResults = searchData?.objects ?? [];

  function handleSearch(q: string, type: string) { setSearchParams({ q: q || " ", type }); }

  // Search mode: show results
  if (searchParams?.q) {
    return (
      <div className="px-6 py-8">
        <div className="mb-8"><SearchBar onSearch={handleSearch} /></div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">搜索结果 ({searchResults.length})</h2>
        {searchLoading ? (
          <p className="text-sm text-slate-400">搜索中…</p>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-20"><p className="text-slate-400">没有找到相关内容</p></div>
        ) : (
          <KnowledgeGrid>{searchResults.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}</KnowledgeGrid>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8"><SearchBar onSearch={handleSearch} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My drafts */}
        <div className="bg-white rounded-xl border p-5">
          <SectionHeader icon={FileText} title="我的草稿" linkTo={`/knowledge/search?owner_id=${user?.id}&status=draft`} linkLabel="全部" />
          {drafts.length === 0 ? (
            <p className="text-sm text-slate-400">暂无草稿</p>
          ) : (
            <KnowledgeGrid>{drafts.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}</KnowledgeGrid>
          )}
        </div>

        {/* Pending my review */}
        <div className="bg-white rounded-xl border p-5">
          <SectionHeader icon={ClipboardCheck} title="待我审核" linkTo="/review" linkLabel="全部" />
          {pending.length === 0 ? (
            <p className="text-sm text-slate-400">暂无待审核内容</p>
          ) : (
            <KnowledgeGrid>{pending.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}</KnowledgeGrid>
          )}
        </div>

        {/* Favorites */}
        <div className="bg-white rounded-xl border p-5">
          <SectionHeader icon={Star} title="我收藏的" linkTo="/favorites" linkLabel="全部" />
          {favorites.length === 0 ? (
            <p className="text-sm text-slate-400">还没有收藏内容</p>
          ) : (
            <KnowledgeGrid>{favorites.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}</KnowledgeGrid>
          )}
        </div>

        {/* Browse history */}
        <div className="bg-white rounded-xl border p-5">
          <SectionHeader icon={History} title="最近浏览" linkTo="/history" linkLabel="全部" />
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">暂无浏览记录</p>
          ) : (
            <KnowledgeGrid>{history.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}</KnowledgeGrid>
          )}
        </div>
      </div>

      {/* Recent updates */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />最近更新
          </h2>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400">知识空间为空</p>
            <div className="flex gap-3 justify-center mt-4">
              <Link to="/documents/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建文档</Link>
              <Link to="/wiki/new" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">创建 Wiki</Link>
            </div>
          </div>
        ) : (
          <KnowledgeGrid>{recent.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}</KnowledgeGrid>
        )}
      </div>
    </div>
  );
}
