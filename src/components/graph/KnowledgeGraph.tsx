import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface GraphNode {
  id: string;
  title: string;
  type: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

interface Point {
  x: number;
  y: number;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const typeColors: Record<string, string> = {
  document: "#3b82f6",
  wiki: "#22c55e",
  drive_file: "#f97316",
};

const RADIUS = 22;
const LABEL_OFFSET = 28;

/** Simple force simulation: repulsion between all nodes, attraction along edges. */
function simulate(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number, iterations = 80): Map<string, Point> {
  const positions = new Map<string, Point>();
  const centerX = width / 2;
  const centerY = height / 2;

  // Initialize in a rough circle
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const r = Math.min(width, height) * 0.3;
    positions.set(n.id, { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) });
  });

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, Point>();
    nodes.forEach(n => forces.set(n.id, { x: 0, y: 0 }));

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!;
        const b = positions.get(nodes[j].id)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const repulsion = 800 / (dist * dist);
        const fx = (dx / dist) * repulsion;
        const fy = (dy / dist) * repulsion;
        forces.get(nodes[i].id)!.x += fx;
        forces.get(nodes[i].id)!.y += fy;
        forces.get(nodes[j].id)!.x -= fx;
        forces.get(nodes[j].id)!.y -= fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = positions.get(edge.source);
      const b = positions.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const attraction = dist * 0.005;
      forces.get(edge.source)!.x += (dx / dist) * attraction;
      forces.get(edge.source)!.y += (dy / dist) * attraction;
      forces.get(edge.target)!.x -= (dx / dist) * attraction;
      forces.get(edge.target)!.y -= (dy / dist) * attraction;
    }

    // Center gravity
    for (const n of nodes) {
      const p = positions.get(n.id)!;
      forces.get(n.id)!.x -= (p.x - centerX) * 0.01;
      forces.get(n.id)!.y -= (p.y - centerY) * 0.01;
    }

    // Apply forces with damping
    const damping = 0.6;
    for (const n of nodes) {
      const p = positions.get(n.id)!;
      const f = forces.get(n.id)!;
      p.x += f.x * damping;
      p.y += f.y * damping;
      // Keep within bounds
      p.x = Math.max(RADIUS, Math.min(width - RADIUS, p.x));
      p.y = Math.max(RADIUS, Math.min(height - RADIUS, p.y));
    }
  }

  return positions;
}

export default function KnowledgeGraph({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        暂无关联内容
      </div>
    );
  }

  const positions = simulate(nodes, edges, size.width, size.height);

  // Quick edge lookup set (reserved for future use)

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border overflow-hidden" style={{ minHeight: 320 }}>
      <svg width={size.width} height={Math.max(size.height, 320)} className="block">
        {/* Edges */}
        {edges.map((e, i) => {
          const src = positions.get(e.source);
          const tgt = positions.get(e.target);
          if (!src || !tgt) return null;
          return (
            <line
              key={i}
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke="#cbd5e1" strokeWidth={1.5}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const pos = positions.get(n.id);
          if (!pos) return null;
          const color = typeColors[n.type] ?? "#94a3b8";
          const isHovered = hoveredId === n.id;
          const r = isHovered ? RADIUS + 3 : RADIUS;
          return (
            <g key={n.id} className="cursor-pointer" onMouseEnter={() => setHoveredId(n.id)} onMouseLeave={() => setHoveredId(null)}>
              <Link to={`/knowledge/${n.id}`}>
                <circle cx={pos.x} cy={pos.y} r={r} fill={color} opacity={isHovered ? 1 : 0.85} stroke="#fff" strokeWidth={2} />
                <text
                  x={pos.x} y={pos.y + LABEL_OFFSET}
                  textAnchor="middle"
                  className="fill-slate-600 text-[11px] pointer-events-none select-none"
                  style={{ fontSize: 11 }}
                >
                  {n.title.length > 10 ? n.title.slice(0, 10) + "…" : n.title}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
