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

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status] ?? "bg-gray-100"}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
