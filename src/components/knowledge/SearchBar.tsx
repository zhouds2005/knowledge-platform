import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

interface Props {
  onSearch: (q: string, type: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(q, type);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="搜索文档、Wiki、网盘文件…"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
      >
        <option value="">全部类型</option>
        <option value="document">文档</option>
        <option value="wiki">Wiki</option>
        <option value="drive_file">网盘</option>
      </select>
      <button
        type="submit"
        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        搜索
      </button>
    </form>
  );
}
