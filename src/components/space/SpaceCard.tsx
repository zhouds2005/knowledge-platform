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
    <div className="bg-card-bg border border-border rounded-lg p-5 hover:border-accent transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <Link to={`/space/${id}`} className="font-semibold text-[15px] hover:text-accent">{name}</Link>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(id)} className="p-1 rounded hover:bg-page-bg" title="编辑">
            <Pencil className="h-3.5 w-3.5 text-text-muted" />
          </button>
          <button onClick={() => onDelete(id)} className="p-1 rounded hover:bg-danger-light" title="删除">
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </button>
        </div>
      </div>
      {description && <p className="text-[13px] text-text-muted line-clamp-2 mb-3">{description}</p>}
      <div className="flex items-center gap-2 text-xs">
        {departmentName && <span className="bg-page-bg text-text-muted px-2 py-0.5 rounded">{departmentName}</span>}
        <span className={autoPublish ? "text-success" : "text-warning"}>{autoPublish ? "自动发布" : "需审核"}</span>
      </div>
    </div>
  );
}
