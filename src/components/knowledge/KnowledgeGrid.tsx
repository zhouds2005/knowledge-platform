import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function KnowledgeGrid({ children }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}
