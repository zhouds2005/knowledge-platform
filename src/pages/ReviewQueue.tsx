import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

async function api(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export default function ReviewQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ["review", "queue"],
    queryFn: () => api("/api/review/queue"),
  });

  const objects = data?.objects ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">审核队列</h1>
      {isLoading ? (
        <p className="text-slate-400">加载中…</p>
      ) : objects.length === 0 ? (
        <p className="text-slate-400">暂无待审核内容</p>
      ) : (
        <ul className="space-y-3">
          {objects.map((obj: any) => (
            <li key={obj.id} className="bg-white rounded-xl border p-4">
              <Link to={`/knowledge/${obj.id}`} className="font-medium text-slate-900 hover:text-blue-600">{obj.title}</Link>
              <p className="text-xs text-slate-400 mt-1">{new Date(obj.createdAt).toLocaleDateString("zh-CN")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
