import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import KnowledgeCard from "../components/knowledge/KnowledgeCard";
import KnowledgeGrid from "../components/knowledge/KnowledgeGrid";

async function api(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function SpaceView() {
  const { spaceId } = useParams<{ spaceId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["space", spaceId],
    queryFn: () => api(`/api/knowledge/space/${spaceId}`),
    enabled: !!spaceId,
  });

  const { data: spaceData } = useQuery({
    queryKey: ["spaces", spaceId],
    queryFn: () => api(`/api/spaces/${spaceId}`),
    enabled: !!spaceId,
  });

  const space = spaceData?.space;
  const objects = data?.objects ?? [];

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{space?.name ?? "知识空间"}</h1>
      {space?.description && <p className="text-sm text-slate-500 mb-6">{space.description}</p>}

      {isLoading ? (
        <p className="text-slate-400">加载中…</p>
      ) : objects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400">此空间暂无内容</p>
        </div>
      ) : (
        <KnowledgeGrid>
          {objects.map((obj: any) => (<KnowledgeCard key={obj.id} {...obj} />))}
        </KnowledgeGrid>
      )}
    </div>
  );
}
