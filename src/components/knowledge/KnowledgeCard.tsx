import { Link } from "react-router-dom";

interface Props {
  id: string;
  title: string;
  type: "document" | "wiki" | "drive_file";
  description: string | null;
  status: string;
  tags: string[] | null;
  ownerName?: string;
  updatedAt: string;
}

const typeLabels: Record<string, string> = {
  document: "文档",
  wiki: "Wiki",
  drive_file: "网盘",
};

const typeColors: Record<string, string> = {
  document: "bg-blue-100 text-blue-700",
  wiki: "bg-green-100 text-green-700",
  drive_file: "bg-orange-100 text-orange-700",
};

const statusLabels: Record<string, string> = {
  draft: "草稿",
  pending_review: "审核中",
  published: "已发布",
  archived: "已归档",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_review: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-600",
};

export default function KnowledgeCard({ id, title, type, description, status, tags, updatedAt }: Props) {
  return (
    <Link
      to={`/knowledge/${id}`}
      className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[type]}`}>
          {typeLabels[type]}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}>
          {statusLabels[status] ?? status}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {tags?.slice(0, 3).map(t => (
          <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{t}</span>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        {new Date(updatedAt).toLocaleDateString("zh-CN")}
      </p>
    </Link>
  );
}
