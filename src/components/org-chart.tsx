"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface OrgPerson {
  name: string;
  title?: string;
  department?: string;
  reports_to?: string;
  location?: string;
  bio?: string;
  [key: string]: string | undefined;
}

interface OrgChartProps {
  data: Record<string, string>[];
  headers: string[];
}

// Detect which columns map to name, title, department, reports_to, bio, location
function detectColumns(headers: string[]) {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (keywords: string[]) =>
    headers[lower.findIndex((h) => keywords.some((k) => h.includes(k)))] || null;

  return {
    name: find(["name", "employee", "person"]) || headers[0],
    title: find(["title", "role", "position", "job"]),
    department: find(["department", "dept", "team", "group", "division"]),
    reportsTo: find(["reports_to", "reportsto", "manager", "supervisor", "parent"]),
    bio: find(["bio", "about", "description", "notes", "summary"]),
    location: find(["location", "city", "office", "site"]),
  };
}

// Department colors
const DEPT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  executive: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400" },
  engineering: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400" },
  product: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400" },
  sales: { bg: "bg-green-500/10", border: "border-green-500/40", text: "text-green-400" },
  marketing: { bg: "bg-pink-500/10", border: "border-pink-500/40", text: "text-pink-400" },
  design: { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-400" },
  hr: { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-400" },
  finance: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400" },
  operations: { bg: "bg-indigo-500/10", border: "border-indigo-500/40", text: "text-indigo-400" },
  support: { bg: "bg-teal-500/10", border: "border-teal-500/40", text: "text-teal-400" },
};

const DEFAULT_DEPT_COLOR = { bg: "bg-neutral-500/10", border: "border-neutral-500/40", text: "text-neutral-400" };

function getDeptColor(dept?: string) {
  if (!dept) return DEFAULT_DEPT_COLOR;
  const key = dept.toLowerCase();
  return Object.entries(DEPT_COLORS).find(([k]) => key.includes(k))?.[1] || DEFAULT_DEPT_COLOR;
}

// Initials from name
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Role icon based on title
function getRoleIcon(title?: string): string {
  if (!title) return "●";
  const t = title.toLowerCase();
  if (t.includes("ceo") || t.includes("cto") || t.includes("cfo") || t.includes("coo") || t.includes("chief")) return "⭐";
  if (t.includes("vp") || t.includes("vice president") || t.includes("director")) return "★";
  if (t.includes("manager") || t.includes("lead") || t.includes("head")) return "◆";
  if (t.includes("senior") || t.includes("sr.") || t.includes("principal")) return "▲";
  return "●";
}

// Custom node component
function OrgNode({ data }: NodeProps) {
  const [flipped, setFlipped] = useState(false);
  const person = data.person as OrgPerson;
  const cols = data.cols as ReturnType<typeof detectColumns>;
  const deptColor = getDeptColor(person[cols.department || ""] || "");

  const name = person[cols.name] || "Unknown";
  const title = cols.title ? person[cols.title] : undefined;
  const department = cols.department ? person[cols.department] : undefined;
  const location = cols.location ? person[cols.location] : undefined;
  const bio = cols.bio ? person[cols.bio] : undefined;

  return (
    <div
      className="cursor-pointer select-none"
      onClick={() => setFlipped(!flipped)}
      style={{ perspective: "1000px" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/20 !border-white/30 !w-2 !h-2" />

      <div
        className="transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className={`w-[220px] rounded-xl border ${deptColor.border} ${deptColor.bg} p-4 backdrop-blur-sm`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`h-10 w-10 rounded-full ${deptColor.border} border-2 flex items-center justify-center text-sm font-bold ${deptColor.text}`}
              >
                {getInitials(name)}
              </div>
              <span className="absolute -top-1 -right-1 text-[10px]" title={title}>
                {getRoleIcon(title)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-white truncate">{name}</p>
              {title && (
                <p className="text-xs text-white/60 truncate">{title}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {department && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${deptColor.border} ${deptColor.text}`}>
                {department}
              </span>
            )}
            {location && (
              <span className="text-[10px] text-white/40 truncate">📍 {location}</span>
            )}
          </div>
          {bio && (
            <p className="text-[10px] text-white/30 mt-2 italic">Click to see bio →</p>
          )}
        </div>

        {/* Back */}
        <div
          className={`w-[220px] rounded-xl border ${deptColor.border} ${deptColor.bg} p-4 backdrop-blur-sm absolute top-0 left-0`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`h-7 w-7 rounded-full ${deptColor.border} border flex items-center justify-center text-xs font-bold ${deptColor.text}`}
            >
              {getInitials(name)}
            </div>
            <p className="font-semibold text-sm text-white truncate">{name}</p>
          </div>
          {bio ? (
            <p className="text-xs text-white/70 leading-relaxed">{bio}</p>
          ) : (
            <p className="text-xs text-white/40 italic">No bio available</p>
          )}
          <p className="text-[10px] text-white/30 mt-3 italic">Click to flip back →</p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white/20 !border-white/30 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { orgNode: OrgNode };

export function OrgChart({ data, headers }: OrgChartProps) {
  const cols = useMemo(() => detectColumns(headers), [headers]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const people = data as OrgPerson[];

    // Build hierarchy: find root(s), then layout level by level
    const nameToIndex = new Map<string, number>();
    people.forEach((p, i) => {
      const name = p[cols.name] || "";
      nameToIndex.set(name.toLowerCase(), i);
    });

    // Find children for each person
    const childrenOf = new Map<number, number[]>();
    const roots: number[] = [];

    people.forEach((p, i) => {
      const reportsTo = cols.reportsTo ? p[cols.reportsTo] : undefined;
      if (!reportsTo || !reportsTo.trim()) {
        roots.push(i);
      } else {
        const parentIdx = nameToIndex.get(reportsTo.toLowerCase());
        if (parentIdx !== undefined) {
          childrenOf.set(parentIdx, [...(childrenOf.get(parentIdx) || []), i]);
        } else {
          roots.push(i); // Parent not found, treat as root
        }
      }
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const NODE_W = 260;
    const NODE_H = 160;

    // Recursive tree layout — each subtree gets its own width allocation
    function getSubtreeWidth(idx: number): number {
      const children = childrenOf.get(idx) || [];
      if (children.length === 0) return NODE_W;
      return children.reduce((sum, c) => sum + getSubtreeWidth(c), 0) + (children.length - 1) * 20;
    }

    const visited = new Set<number>();

    function layoutNode(idx: number, x: number, y: number) {
      if (visited.has(idx)) return;
      visited.add(idx);

      const person = people[idx];
      nodes.push({
        id: String(idx),
        type: "orgNode",
        position: { x, y },
        data: { person, cols },
      });

      // Edge to parent
      const reportsTo = cols.reportsTo ? person[cols.reportsTo] : undefined;
      if (reportsTo && reportsTo.trim()) {
        const parentIdx = nameToIndex.get(reportsTo.toLowerCase());
        if (parentIdx !== undefined) {
          edges.push({
            id: `e-${parentIdx}-${idx}`,
            source: String(parentIdx),
            target: String(idx),
            type: "smoothstep",
            style: { stroke: "rgba(255,255,255,0.15)", strokeWidth: 2 },
            animated: false,
          });
        }
      }

      // Layout children
      const children = childrenOf.get(idx) || [];
      if (children.length === 0) return;

      const totalWidth = children.reduce((sum, c) => sum + getSubtreeWidth(c), 0) + (children.length - 1) * 20;
      let childX = x + NODE_W / 2 - totalWidth / 2;

      children.forEach((childIdx) => {
        const childW = getSubtreeWidth(childIdx);
        layoutNode(childIdx, childX + childW / 2 - NODE_W / 2, y + NODE_H);
        childX += childW + 20;
      });
    }

    // Layout each root tree centered
    const totalRootWidth = roots.reduce((sum, r) => sum + getSubtreeWidth(r), 0) + (roots.length - 1) * 60;
    let rootX = -totalRootWidth / 2;
    roots.forEach((rootIdx) => {
      const w = getSubtreeWidth(rootIdx);
      layoutNode(rootIdx, rootX + w / 2 - NODE_W / 2, 0);
      rootX += w + 60;
    });

    // Handle disconnected nodes
    people.forEach((person, idx) => {
      if (!visited.has(idx)) {
        nodes.push({
          id: String(idx),
          type: "orgNode",
          position: { x: rootX, y: 0 },
          data: { person, cols },
        });
        rootX += NODE_W + 20;
      }
    });

    return { nodes, edges };
  }, [data, cols]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px] rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.03)" gap={20} />
        <Controls
          className="!bg-neutral-900 !border-white/10 !rounded-lg [&>button]:!bg-neutral-800 [&>button]:!border-white/10 [&>button]:!text-white [&>button:hover]:!bg-neutral-700"
        />
      </ReactFlow>
    </div>
  );
}
