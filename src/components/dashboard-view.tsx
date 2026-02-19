"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  Search,
  ChevronDown,
  Lightbulb,
  ArrowUpDown,
  Download,
  Camera,
  TrendingUp,
  TrendingDown,
  Hash,
  FileSpreadsheet,
  BarChart2,
} from "lucide-react";
import type { DashboardConfig, ChartConfig } from "@/lib/gemini";
import { OrgChart } from "@/components/org-chart";

// ─── Canonical 8-color palette ───────────────────────────────────────────────
const CHART_COLORS = [
  "#3b82f6", // blue
  "#f97316", // orange
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ec4899", // pink
];

// Slightly brighter variants for dark mode (used via CSS var or inline if needed)
const CHART_COLORS_DARK = [
  "#60a5fa",
  "#fb923c",
  "#34d399",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
  "#facc15",
  "#f472b6",
];

interface DashboardViewProps {
  config: DashboardConfig;
  data: {
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
  };
}

// ─── Column helpers ──────────────────────────────────────────────────────────

/** Case-insensitive column value lookup — fixes AI casing mismatches */
function getColValue(row: Record<string, string>, colName: string): string | undefined {
  if (!colName) return undefined;
  if (row[colName] !== undefined) return row[colName];
  const lower = colName.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) return row[key];
  }
  return undefined;
}

/** Parse float robustly from strings like "$42,000", "3.2%", "1.4K" */
function parseNumeric(val: string | undefined): number {
  if (!val) return NaN;
  const cleaned = val.replace(/[$,%]/g, "").replace(/,/g, "").trim();
  if (cleaned.toLowerCase().endsWith("k")) return parseFloat(cleaned) * 1000;
  if (cleaned.toLowerCase().endsWith("m")) return parseFloat(cleaned) * 1_000_000;
  return parseFloat(cleaned);
}

function isDateColumn(header: string, rows: Record<string, string>[]): boolean {
  const lowerHeader = header.toLowerCase();
  if (
    lowerHeader.includes("date") || lowerHeader.includes("time") ||
    lowerHeader.includes("created") || lowerHeader.includes("updated") ||
    lowerHeader.includes("closed") || lowerHeader.includes("opened") ||
    lowerHeader.includes("modified") || lowerHeader.includes("timestamp") ||
    lowerHeader.endsWith("_at") || lowerHeader === "month" || lowerHeader === "week" ||
    lowerHeader === "year" || lowerHeader === "quarter"
  ) return true;

  const vals = rows.slice(0, 15).map((r) => r[header]).filter(Boolean);
  if (vals.length === 0) return false;
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /^\d{1,2}-\d{1,2}-\d{2,4}/,
    /^[A-Za-z]+ \d{1,2},?\s+\d{4}/,
    /^\d{4}\/\d{2}\/\d{2}/,
    /^[A-Za-z]{3,9}\s+\d{4}$/, // "Jan 2025"
  ];
  const dateCount = vals.filter((v) => datePatterns.some((p) => p.test(v.trim()))).length;
  return dateCount > vals.length * 0.5;
}

// ─── Count-up animation hook ─────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, enabled = true): number {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!enabled || isNaN(target)) { setCurrent(target); return; }
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration, enabled]);
  return current;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-xl px-3.5 py-2.5 shadow-2xl text-sm border border-white/10 min-w-[130px] max-w-[220px]">
      {label && (
        <p className="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wide truncate">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: p.color || CHART_COLORS[i % CHART_COLORS.length] }}
          />
          <span className="text-gray-400 text-xs truncate max-w-[100px]">{p.name}</span>
          <span className="text-white font-bold text-xs ml-auto">
            {typeof p.value === "number"
              ? p.value >= 10000
                ? `$${(p.value / 1000).toFixed(1)}K`
                : p.value >= 1000
                ? p.value.toLocaleString()
                : Number(p.value.toFixed(2)).toString()
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Sparkline ──────────────────────────────────────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-full h-[40px] opacity-70">
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#spark-${color.replace("#", "")})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (newValue: string) => void;
}) {
  const colorMap: Record<string, string> = {
    complete: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    done: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    reviewed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    "closed won": "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    active: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    "in progress": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    negotiation: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800",
    open: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800",
    "proposal sent": "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
    discovery: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    "in review": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
    todo: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
    backlog: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
    critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    "closed lost": "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    closed: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
  };
  const colorClass = colorMap[value.toLowerCase()] ||
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          <Badge variant="outline" className={`${colorClass} cursor-pointer hover:opacity-80 transition-opacity`}>
            {value}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => onChange(opt)}>{opt}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── KPI Stat Card — DataFast level ─────────────────────────────────────────
function StatCard({
  label,
  value,
  rawNumber,
  change,
  trend,
  icon: Icon,
  sparklineData,
  colorIndex = 0,
  animDelay = 0,
}: {
  label: string;
  value: string;
  rawNumber?: number;
  change?: string;
  trend?: "up" | "down" | "flat";
  icon?: React.ElementType;
  sparklineData?: number[];
  colorIndex?: number;
  animDelay?: number;
}) {
  const isPositive = trend === "up" || (change ? !change.startsWith("-") : false);
  const accentColor = CHART_COLORS[colorIndex % CHART_COLORS.length];
  const countedNum = useCountUp(rawNumber ?? NaN, 900, rawNumber !== undefined && !isNaN(rawNumber));

  // Format the counted number in the same style as the original value
  const displayValue = rawNumber !== undefined && !isNaN(rawNumber)
    ? value.startsWith("$")
      ? countedNum >= 1000
        ? `$${(countedNum / 1000).toFixed(1)}K`
        : `$${Math.round(countedNum).toLocaleString()}`
      : countedNum >= 1000
        ? Math.round(countedNum).toLocaleString()
        : Number(countedNum.toFixed(1)).toString()
    : value;

  const moodBg = trend === "up"
    ? "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900/60"
    : trend === "down"
    ? "from-rose-50 to-white dark:from-rose-950/20 dark:to-gray-900/60"
    : "from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/60";

  return (
    <div
      className={`chart-animate rounded-xl border border-gray-200 dark:border-white/10 bg-gradient-to-br ${moodBg} p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate pr-2">
          {label}
        </p>
        {Icon && (
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none tabular-nums">
        {displayValue}
      </p>

      {change && (
        <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
        }`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </p>
      )}

      {sparklineData && sparklineData.length >= 2 && (
        <div className="mt-3 -mx-1">
          <MiniSparkline data={sparklineData} color={accentColor} />
        </div>
      )}
    </div>
  );
}

// ─── Empty state for charts ───────────────────────────────────────────────────
function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] gap-3 text-gray-400 dark:text-gray-600">
      <BarChart2 className="h-10 w-10 opacity-30" />
      <p className="text-sm font-medium">No data available</p>
    </div>
  );
}

// ─── Gradient ID helper ───────────────────────────────────────────────────────
function gId(index: number) {
  return `grad-${index}`;
}

// ─── Chart Card ──────────────────────────────────────────────────────────────
function ChartCard({
  chart,
  data,
  index,
}: {
  chart: ChartConfig;
  data: Record<string, string>[];
  index: number;
}) {
  const color = CHART_COLORS[index % CHART_COLORS.length];
  const gradientId = gId(index);

  const axisProps = {
    tick: { fontSize: 11, fill: "#9ca3af" },
    stroke: "transparent",
  } as const;

  const gridProps = {
    strokeDasharray: "3 3" as const,
    stroke: "#374151",
    strokeOpacity: 0.4,
  };

  const chartData = useMemo(() => {
    if (!data.length) return [];

    if (chart.type === "pie") {
      const grouped: Record<string, number> = {};
      data.forEach((row) => {
        const key = getColValue(row, chart.xAxis) || "Unknown";
        const val = parseNumeric(getColValue(row, chart.yAxis));
        grouped[key] = (grouped[key] || 0) + (isNaN(val) ? 1 : val);
      });
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }

    if (chart.type === "bar" || chart.type === "horizontalBar") {
      const grouped: Record<string, number> = {};
      data.forEach((row) => {
        const key = getColValue(row, chart.xAxis) || "Unknown";
        const val = parseNumeric(getColValue(row, chart.yAxis));
        grouped[key] = (grouped[key] || 0) + (isNaN(val) ? 0 : val);
      });
      const entries = Object.entries(grouped)
        .filter(([, v]) => v !== 0)
        .map(([name, value]) => ({ name, value }));
      if (chart.type === "horizontalBar") entries.sort((a, b) => b.value - a.value);
      return entries.slice(0, 20);
    }

    // Line / area — preserve order, dedup by xAxis
    const seen = new Set<string>();
    const deduped: Record<string, string>[] = [];
    for (const row of data) {
      const key = getColValue(row, chart.xAxis) ?? "";
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      }
    }
    const slice = deduped.length > 60 ? deduped.slice(0, 60) : deduped;
    return slice.map((row) => ({
      name: getColValue(row, chart.xAxis) || "",
      value: (() => {
        const v = parseNumeric(getColValue(row, chart.yAxis));
        return isNaN(v) ? 0 : v;
      })(),
    }));
  }, [chart, data]);

  // Check if we have meaningful data to render
  const hasData = chartData.length > 0 && chartData.some((d) => (d as { value?: number }).value !== 0);

  const tooltipCursor = { fill: "rgba(255,255,255,0.04)" };
  const lineCursor = { stroke: "rgba(156,163,175,0.3)", strokeWidth: 1 };

  return (
    <Card
      className="border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-xl chart-animate"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyChartState />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={chart.type === "horizontalBar" ? Math.max(260, chartData.length * 42) : 260}
          >
            {chart.type === "horizontalBar" ? (
              <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 16 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="name" {...axisProps} width={130} />
                <Tooltip content={<ChartTooltip />} cursor={tooltipCursor} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} isAnimationActive={true} animationDuration={700}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chart.type === "bar" ? (
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<ChartTooltip />} cursor={tooltipCursor} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} isAnimationActive={true} animationDuration={700}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chart.type === "line" ? (
              /* ── LINE CHART — no defs inside, use direct stroke color ── */
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<ChartTooltip />} cursor={lineCursor} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ fill: color, stroke: "white", r: 3, strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: color, stroke: "white", strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </LineChart>
            ) : chart.type === "area" ? (
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<ChartTooltip />} cursor={lineCursor} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: color, stroke: "white", strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </AreaChart>
            ) : (
              /* ── PIE / DONUT ── */
              <PieChart>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
                  )}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={2}
                  isAnimationActive={true}
                  animationDuration={800}
                  label={({ percent }) => percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main DashboardView ───────────────────────────────────────────────────────
export function DashboardView({ config, data }: DashboardViewProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(config.table.sortBy || null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});

  const isOrgChart = useMemo(() => {
    const lower = data.headers.map((h) => h.toLowerCase());
    return lower.some((h) =>
      h.includes("reports_to") || h.includes("reportsto") ||
      h.includes("manager") || h.includes("supervisor")
    );
  }, [data.headers]);

  // ─── KPI stats with sparklines ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const result: {
      label: string;
      value: string;
      rawNumber?: number;
      trend?: "up" | "down" | "flat";
      change?: string;
      icon?: React.ElementType;
      sparklineData?: number[];
    }[] = [];

    result.push({ label: "Total Rows", value: data.totalRows.toLocaleString(), rawNumber: data.totalRows, icon: Hash });
    result.push({ label: "Columns", value: data.headers.length.toString(), rawNumber: data.headers.length, icon: FileSpreadsheet });

    const numericCols = data.headers.filter((h) => {
      if (isDateColumn(h, data.rows)) return false;
      const vals = data.rows.slice(0, 10).map((r) => r[h]);
      return vals.some((v) => v && !isNaN(parseNumeric(v)));
    });

    numericCols.slice(0, 2).forEach((col, ci) => {
      const vals = data.rows.map((r) => parseNumeric(r[col] || "0")).filter((v) => !isNaN(v));
      if (!vals.length) return;

      const sum = vals.reduce((a, b) => a + b, 0);
      const mid = Math.floor(vals.length / 2);
      const firstHalf = vals.slice(0, mid).reduce((a, b) => a + b, 0);
      const secondHalf = vals.slice(mid).reduce((a, b) => a + b, 0);
      const trendDir: "up" | "down" | "flat" = secondHalf > firstHalf ? "up" : secondHalf < firstHalf ? "down" : "flat";
      const pctChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
      const changeStr = pctChange !== 0
        ? `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}% vs prior`
        : undefined;

      const isLarge = sum > 1000;
      result.push({
        label: `Total ${col}`,
        value: isLarge ? `$${(sum / 1000).toFixed(1)}K` : sum.toLocaleString(),
        rawNumber: sum,
        trend: trendDir,
        change: changeStr,
        icon: trendDir === "up" ? TrendingUp : TrendingDown,
        sparklineData: vals.slice(0, 14),
      });
    });

    if (config.table.statusField) {
      const statuses = new Set(data.rows.map((r) => r[config.table.statusField!]));
      result.push({ label: "Statuses", value: statuses.size.toString(), rawNumber: statuses.size });
    }

    return result.slice(0, 4);
  }, [data, config]);

  // ─── Table filtering / sorting ──────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = data.rows.map((row, i) => ({ ...row, ...overrides[i] }));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) => Object.values(row).some((v) => v?.toLowerCase().includes(q)));
    }
    if (sortCol) {
      rows.sort((a, b) => {
        const aVal = a[sortCol] || "";
        const bVal = b[sortCol] || "";
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return rows;
  }, [data.rows, search, sortCol, sortDir, overrides]);

  const handleStatusChange = (rowIndex: number, column: string, newValue: string) => {
    setOverrides((prev) => ({ ...prev, [rowIndex]: { ...prev[rowIndex], [column]: newValue } }));
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleDownloadPng = async () => {
    if (!dashboardRef.current) return;
    const { toPng } = await import("html-to-image");
    try {
      const dataUrl = await toPng(dashboardRef.current, { quality: 0.95, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${config.title || "dashboard"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    }
  };

  const handleExportCsv = () => {
    const headers = config.table.columns;
    const csvRows = [
      headers.join(","),
      ...filteredRows.map((row) =>
        headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.title.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7 transition-colors duration-200" ref={dashboardRef}>
      {/* ── Header ── */}
      <div className="chart-animate" style={{ animationDelay: "0ms" }}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {config.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.description}</p>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            rawNumber={stat.rawNumber}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            sparklineData={stat.sparklineData}
            colorIndex={i}
            animDelay={i * 60}
          />
        ))}
      </div>

      {/* ── AI Insights ── */}
      {config.insights.length > 0 && (
        <Card
          className="border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm chart-animate"
          style={{ animationDelay: "240ms" }}
        >
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {config.insights.map((insight, i) => (
                  <p key={i} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{insight}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Org Chart ── */}
      {isOrgChart && (
        <div className="chart-animate" style={{ animationDelay: "280ms" }}>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Organization</h2>
          <OrgChart data={data.rows} headers={data.headers} />
        </div>
      )}

      {/* ── Charts grid ── */}
      {config.charts.length > 0 && (
        <div className={`grid gap-5 ${config.charts.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {config.charts.map((chart, i) => (
            <ChartCard key={i} chart={chart} data={data.rows} index={i} />
          ))}
        </div>
      )}

      {/* ── Data Table ── */}
      <Card
        className="border-gray-200 dark:border-gray-800 shadow-sm rounded-xl chart-animate"
        style={{ animationDelay: `${(config.charts.length + 2) * 80}ms` }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Data
              <span className="ml-2 text-xs font-normal text-gray-400">
                {filteredRows.length} rows{filteredRows.length > 100 ? " (showing first 100)" : ""}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-[180px] text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadPng}>
                <Camera className="h-4 w-4 mr-1" />PNG
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-1" />Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  {config.table.columns.map((col) => (
                    <TableHead
                      key={col}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1">
                        {col}
                        {sortCol === col ? (
                          <span className="text-orange-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-30" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.slice(0, 100).map((row, rowIdx) => (
                  <TableRow
                    key={rowIdx}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 even:bg-gray-50/40 dark:even:bg-white/[0.02]"
                  >
                    {config.table.columns.map((col) => (
                      <TableCell key={col} className="whitespace-nowrap py-2.5">
                        {col === config.table.statusField && config.table.statusOptions ? (
                          <StatusBadge
                            value={row[col] || ""}
                            options={config.table.statusOptions}
                            onChange={(v) => handleStatusChange(rowIdx, col, v)}
                          />
                        ) : (
                          <span className="text-sm text-gray-700 dark:text-gray-200">{row[col]}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredRows.length > 100 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Showing 100 of {filteredRows.length} rows
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
