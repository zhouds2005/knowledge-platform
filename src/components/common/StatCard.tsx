import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}

export default function StatCard({ label, value, sub, colorClass }: StatCardProps) {
  return (
    <div className="bg-card-bg border border-border rounded-lg px-5 py-[18px]">
      <div className="text-[13px] text-text-muted mb-1">{label}</div>
      <div className={cn("font-serif text-[26px] font-bold", colorClass)}>
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
