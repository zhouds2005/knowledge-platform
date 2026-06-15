import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

interface SpaceCardProps {
  id: string;
  name: string;
  description: string | null;
  departmentName?: string;
  autoPublish: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SpaceCard({ id, name, description, departmentName, autoPublish, onEdit, onDelete }: SpaceCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-2">
        <Link to={`/space/${id}`} className="font-semibold text-slate-900 hover:text-blue-600">
          {name}
        </Link>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(id)} className="p-1 rounded hover:bg-slate-100" title="编辑">
            <Pencil className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <button onClick={() => onDelete(id)} className="p-1 rounded hover:bg-red-50" title="删除">
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      </div>
      {description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{description}</p>}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {departmentName && <span className="bg-slate-100 px-2 py-0.5 rounded">{departmentName}</span>}
        <span className={autoPublish ? "text-green-600" : "text-yellow-600"}>
          {autoPublish ? "自动发布" : "需审核"}
        </span>
      </div>
    </div>
  );
}
