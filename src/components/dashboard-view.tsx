"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Settings,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp as AreaIcon,
  AlignLeft,
  Eye,
  EyeOff,
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

interface DashboardViewProps {
  config: DashboardConfig;
  data: {
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
  };
  isEditMode?: boolean;
  onConfigChange?: (config: DashboardConfig) => void;
}

// ─── Column helpers ──────────────────────────────────────────────────────────
function getColValue(row: Record<string, string>, colName: string): string | undefined {
  if (!colName) return undefined;
  if (row[colName] !== undefined) return row[colName];
  const lower = colName.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) return row[key];
  }
  return undefined;
}

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
    /^[A-Za-z]{3,9}\s+\d{4}$/,
  ];
  const dateCount = vals.filter((v) => datePatterns.some((p) => p.test(v.trim()))).length;
  return dateCount > vals.length * 0.5;
}

function isNumericColumn(header: string, rows: Record<string, string>[]): boolean {
  if (isDateColumn(header, rows)) return false;
  const vals = rows.slice(0, 15).map((r) => r[header]).filter(Boolean);
  if (vals.length === 0) return false;
  const numCount = vals.filter((v) => !isNaN(parseNumeric(v))).length;
  return numCount > vals.length * 0.5;
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
      const eased = 1 - Math.pow(1 - progress, 3);
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
        <p className="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wide truncate">{label}</p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || CHART_COLORS[i % CHART_COLORS.length] }} />
          <span className="text-gray-400 text-xs truncate max-w-[100px]">{p.name}</span>
          <span className="text-white font-bold text-xs ml-auto">
            {typeof p.value === "number"
              ? p.value >= 10000 ? `$${(p.value / 1000).toFixed(1)}K`
              : p.value >= 1000 ? p.value.toLocaleString()
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
          <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spark-${color.replace("#", "")})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
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
  const colorClass = colorMap[value.toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          <Badge variant="outline" className={`${colorClass} cursor-pointer hover:opacity-80 transition-opacity`}>
            {value}<ChevronDown className="ml-1 h-3 w-3" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((opt) => <DropdownMenuItem key={opt} onClick={() => onChange(opt)}>{opt}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── KPI Stat Card ───────────────────────────────────────────────────────────
function StatCard({ label, value, rawNumber, change, trend, icon: Icon, sparklineData, colorIndex = 0, animDelay = 0 }: {
  label: string; value: string; rawNumber?: number; change?: string; trend?: "up" | "down" | "flat";
  icon?: React.ElementType; sparklineData?: number[]; colorIndex?: number; animDelay?: number;
}) {
  const isPositive = trend === "up" || (change ? !change.startsWith("-") : false);
  const accentColor = CHART_COLORS[colorIndex % CHART_COLORS.length];
  const countedNum = useCountUp(rawNumber ?? NaN, 900, rawNumber !== undefined && !isNaN(rawNumber));

  const displayValue = rawNumber !== undefined && !isNaN(rawNumber)
    ? value.startsWith("$")
      ? countedNum >= 1000 ? `$${(countedNum / 1000).toFixed(1)}K` : `$${Math.round(countedNum).toLocaleString()}`
      : countedNum >= 1000 ? Math.round(countedNum).toLocaleString() : Number(countedNum.toFixed(1)).toString()
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
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate pr-2">{label}</p>
        {Icon && (
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}22` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none tabular-nums">{displayValue}</p>
      {change && (
        <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </p>
      )}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="mt-3 -mx-1"><MiniSparkline data={sparklineData} color={accentColor} /></div>
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
function gId(index: number) { return `grad-${index}`; }

// ─── Chart renderer (shared between preview and main) ────────────────────────
function renderChartContent(
  chart: ChartConfig,
  chartData: Array<{ name: string; value: number }>,
  index: number,
  color: string,
  height = 260
) {
  const gradientId = gId(index);
  const axisProps = { tick: { fontSize: 11, fill: "#9ca3af" }, stroke: "transparent" } as const;
  const gridProps = { strokeDasharray: "3 3" as const, stroke: "#374151", strokeOpacity: 0.4 };
  const tooltipCursor = { fill: "rgba(255,255,255,0.04)" };
  const lineCursor = { stroke: "rgba(156,163,175,0.3)", strokeWidth: 1 };

  if (!chartData.length || !chartData.some((d) => d.value !== 0)) {
    return <EmptyChartState />;
  }

  const chartH = chart.type === "horizontalBar" ? Math.max(height, chartData.length * 42) : height;

  return (
    <ResponsiveContainer width="100%" height={chartH}>
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
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} isAnimationActive animationDuration={700}>
            {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
          <Bar dataKey="value" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={700}>
            {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      ) : (chart.type as string) === "line" ? (
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip content={<ChartTooltip />} cursor={lineCursor} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ fill: color, stroke: "white", r: 3, strokeWidth: 1.5 }} activeDot={{ r: 5, fill: color, stroke: "white", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
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
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: color, stroke: "white", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
        </AreaChart>
      ) : (
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Legend formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>} />
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} innerRadius={45} paddingAngle={2} isAnimationActive animationDuration={800} label={({ percent }) => percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
            {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
          </Pie>
        </PieChart>
      )}
    </ResponsiveContainer>
  );
}

// ─── Chart data builder (shared) ─────────────────────────────────────────────
function buildChartData(chart: ChartConfig, rows: Record<string, string>[]) {
  if (!rows.length) return [];
  
  // Validate that xAxis and yAxis columns actually exist in the data
  const sampleRow = rows[0];
  const xExists = chart.xAxis && getColValue(sampleRow, chart.xAxis) !== undefined;
  const yExists = chart.yAxis && getColValue(sampleRow, chart.yAxis) !== undefined;
  
  if (!xExists || !yExists) {
    // Try to auto-detect: find a categorical and numeric column
    const headers = Object.keys(sampleRow);
    const numericHeaders = headers.filter(h => {
      const vals = rows.slice(0, 10).map(r => r[h]).filter(Boolean);
      return vals.filter(v => !isNaN(parseFloat(v.replace(/[$,%]/g, "").replace(/,/g, "")))).length > vals.length * 0.4;
    });
    const catHeaders = headers.filter(h => !numericHeaders.includes(h));
    
    if (!xExists && catHeaders.length > 0) chart = { ...chart, xAxis: catHeaders[0] };
    else if (!xExists && headers.length > 0) chart = { ...chart, xAxis: headers[0] };
    
    if (!yExists && numericHeaders.length > 0) chart = { ...chart, yAxis: numericHeaders[0] };
    else if (!yExists) return []; // Can't build any chart without numeric data
  }

  if (chart.type === "pie") {
    const grouped: Record<string, number> = {};
    rows.forEach((row) => {
      const key = getColValue(row, chart.xAxis) || "Unknown";
      const val = parseNumeric(getColValue(row, chart.yAxis));
      grouped[key] = (grouped[key] || 0) + (isNaN(val) ? 1 : val);
    });
    const entries = Object.entries(grouped).map(([name, value]) => ({ name, value }));
    // Limit pie slices to 10, group rest as "Other"
    if (entries.length > 10) {
      entries.sort((a, b) => b.value - a.value);
      const top = entries.slice(0, 9);
      const otherVal = entries.slice(9).reduce((s, e) => s + e.value, 0);
      return [...top, { name: "Other", value: otherVal }];
    }
    return entries;
  }

  if (chart.type === "bar" || chart.type === "horizontalBar") {
    const grouped: Record<string, number> = {};
    const order: string[] = []; // preserve insertion order for time series
    rows.forEach((row) => {
      const key = getColValue(row, chart.xAxis) || "Unknown";
      const val = parseNumeric(getColValue(row, chart.yAxis));
      if (!(key in grouped)) order.push(key);
      grouped[key] = (grouped[key] || 0) + (isNaN(val) ? 0 : val);
    });
    let entries = order.map(name => ({ name, value: grouped[name] }));
    // Don't filter out zeros — they're valid data points for time series
    if (chart.type === "horizontalBar") entries.sort((a, b) => b.value - a.value);
    return entries.slice(0, 30);
  }

  // Line / area fallback (shouldn't reach here after remap, but just in case)
  const seen = new Set<string>();
  const deduped: Record<string, string>[] = [];
  for (const row of rows) {
    const key = getColValue(row, chart.xAxis) ?? "";
    if (!seen.has(key)) { seen.add(key); deduped.push(row); }
  }
  return deduped.slice(0, 60).map((row) => ({
    name: getColValue(row, chart.xAxis) || "",
    value: (() => { const v = parseNumeric(getColValue(row, chart.yAxis)); return isNaN(v) ? 0 : v; })(),
  }));
}

// ─── Chart Type Icons ────────────────────────────────────────────────────────
const CHART_TYPES: { type: ChartConfig["type"]; label: string; Icon: React.ElementType }[] = [
  { type: "bar", label: "Bar", Icon: BarChart3 },
  { type: "area", label: "Area", Icon: AreaIcon },
  { type: "pie", label: "Pie/Donut", Icon: PieIcon },
  { type: "horizontalBar", label: "H-Bar", Icon: AlignLeft },
];

// ─── Chart Settings Dialog ───────────────────────────────────────────────────
function ChartSettingsDialog({
  open,
  chart,
  index,
  headers,
  rows,
  onSave,
  onClose,
}: {
  open: boolean;
  chart: ChartConfig | null;
  index: number;
  headers: string[];
  rows: Record<string, string>[];
  onSave: (chart: ChartConfig) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<ChartConfig | null>(null);

  useEffect(() => {
    if (chart) setLocal({ ...chart });
  }, [chart, open]);

  const numericHeaders = useMemo(
    () => headers.filter((h) => isNumericColumn(h, rows)),
    [headers, rows]
  );

  const previewData = useMemo(() => {
    if (!local) return [];
    return buildChartData(local, rows);
  }, [local, rows]);

  const previewColor = local?.color || CHART_COLORS[index % CHART_COLORS.length];

  if (!local) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chart Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left: Settings */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Title</label>
              <Input
                value={local.title}
                onChange={(e) => setLocal({ ...local, title: e.target.value })}
                placeholder="Chart title"
                className="text-sm"
              />
            </div>

            {/* Chart Type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Chart Type</label>
              <div className="grid grid-cols-2 gap-2">
                {CHART_TYPES.map(({ type, label, Icon }) => (
                  <button
                    key={type}
                    onClick={() => setLocal({ ...local, type })}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      local.type === type
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* X Axis */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">X Axis (Category)</label>
              <select
                value={local.xAxis}
                onChange={(e) => setLocal({ ...local, xAxis: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            {/* Y Axis */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Y Axis (Value)</label>
              <select
                value={local.yAxis}
                onChange={(e) => setLocal({ ...local, yAxis: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {(numericHeaders.length ? numericHeaders : headers).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {CHART_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setLocal({ ...local, color: c })}
                    className={`h-7 w-7 rounded-full transition-all ${(local.color || CHART_COLORS[index % CHART_COLORS.length]) === c ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Preview</label>
            <div className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 p-3 min-h-[200px]">
              {renderChartContent(local, previewData, index, previewColor, 180)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { onSave(local); onClose(); }}
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Chart Card ──────────────────────────────────────────────────────────────
function ChartCard({
  chart: rawChart,
  data,
  index,
  isEditMode,
  onEdit,
  onRemove,
}: {
  chart: ChartConfig;
  data: Record<string, string>[];
  index: number;
  isEditMode?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  // Tailwind v4 CSS reset breaks SVG <path> fill rendering in Chromium.
  // Line and Area charts use <path> elements that become invisible.
  // Bar charts use <rect> elements which render correctly.
  const chartType = rawChart.type as string;
  const chart = (chartType === "line" || chartType === "area") ? { ...rawChart, type: "bar" as const } : rawChart;
  const color = chart.color || CHART_COLORS[index % CHART_COLORS.length];

  const chartData = useMemo(() => buildChartData(chart, data), [chart, data]);

  return (
    <Card
      className={`border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-xl chart-animate relative ${isEditMode ? "ring-2 ring-orange-500/30 ring-offset-0" : ""}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Edit mode overlay controls */}
      {isEditMode && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 transition-colors"
            title="Edit chart"
          >
            <Settings className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={onRemove}
            className="h-7 w-7 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-colors"
            title="Remove chart"
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 pr-20">
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderChartContent(chart, chartData, index, color)}
      </CardContent>
    </Card>
  );
}

// ─── AI Suggestion Card ───────────────────────────────────────────────────────
interface ChartSuggestion extends ChartConfig {
  reason: string;
}

function SuggestionCard({
  suggestion,
  index,
  onAdd,
}: {
  suggestion: ChartSuggestion;
  index: number;
  onAdd: () => void;
}) {
  const Icon = CHART_TYPES.find((t) => t.type === suggestion.type)?.Icon || BarChart3;
  const color = CHART_COLORS[index % CHART_COLORS.length];

  return (
    <div className="rounded-xl border border-dashed border-orange-300 dark:border-orange-700/50 bg-orange-50/30 dark:bg-orange-950/10 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{suggestion.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.type} · {suggestion.xAxis} vs {suggestion.yAxis}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90 text-xs h-7 px-3 shrink-0"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
        💡 {suggestion.reason}
      </p>
    </div>
  );
}

// ─── Main DashboardView ───────────────────────────────────────────────────────
export function DashboardView({ config, data, isEditMode = false, onConfigChange }: DashboardViewProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(config.table.sortBy || null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});

  // Table visibility state — derived from config, synced on config change
  const [showTable, setShowTable] = useState<boolean>(config.showTable ?? true);

  useEffect(() => {
    setShowTable(config.showTable ?? true);
  }, [config.showTable]);

  const handleToggleTable = useCallback(() => {
    const next = !showTable;
    setShowTable(next);
    if (onConfigChange) onConfigChange({ ...config, showTable: next });
  }, [showTable, config, onConfigChange]);

  // Edit mode state
  const [editingChartIndex, setEditingChartIndex] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Close settings dialog when leaving edit mode
  useEffect(() => {
    if (!isEditMode) {
      setEditingChartIndex(null);
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [isEditMode]);

  const isOrgChart = useMemo(() => {
    const lower = data.headers.map((h) => h.toLowerCase());
    return lower.some((h) =>
      h.includes("reports_to") || h.includes("reportsto") ||
      h.includes("manager") || h.includes("supervisor")
    );
  }, [data.headers]);

  // ─── Numeric columns (for AI suggest) ──────────────────────────────────────
  const numericColumns = useMemo(
    () => data.headers.filter((h) => isNumericColumn(h, data.rows)),
    [data.headers, data.rows]
  );

  // ─── KPI stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const result: {
      label: string; value: string; rawNumber?: number; trend?: "up" | "down" | "flat";
      change?: string; icon?: React.ElementType; sparklineData?: number[];
    }[] = [];

    result.push({ label: "Total Rows", value: data.totalRows.toLocaleString(), rawNumber: data.totalRows, icon: Hash });
    result.push({ label: "Columns", value: data.headers.length.toString(), rawNumber: data.headers.length, icon: FileSpreadsheet });

    numericColumns.slice(0, 2).forEach((col) => {
      const vals = data.rows.map((r) => parseNumeric(r[col] || "0")).filter((v) => !isNaN(v));
      if (!vals.length) return;
      const sum = vals.reduce((a, b) => a + b, 0);
      const mid = Math.floor(vals.length / 2);
      const firstHalf = vals.slice(0, mid).reduce((a, b) => a + b, 0);
      const secondHalf = vals.slice(mid).reduce((a, b) => a + b, 0);
      const trendDir: "up" | "down" | "flat" = secondHalf > firstHalf ? "up" : secondHalf < firstHalf ? "down" : "flat";
      const pctChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
      const changeStr = pctChange !== 0 ? `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}% vs prior` : undefined;
      const isLarge = sum > 1000;
      result.push({
        label: `Total ${col}`, value: isLarge ? `$${(sum / 1000).toFixed(1)}K` : sum.toLocaleString(),
        rawNumber: sum, trend: trendDir, change: changeStr,
        icon: trendDir === "up" ? TrendingUp : TrendingDown, sparklineData: vals.slice(0, 14),
      });
    });

    if (config.table.statusField) {
      const statuses = new Set(data.rows.map((r) => r[config.table.statusField!]));
      result.push({ label: "Statuses", value: statuses.size.toString(), rawNumber: statuses.size });
    }

    return result.slice(0, 4);
  }, [data, config, numericColumns]);

  // ─── Table ──────────────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = data.rows.map((row, i) => ({ ...row, ...overrides[i] }));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) => Object.values(row).some((v) => v?.toLowerCase().includes(q)));
    }
    if (sortCol) {
      rows.sort((a, b) => {
        const aVal = a[sortCol] || "", bVal = b[sortCol] || "";
        const aNum = parseFloat(aVal), bNum = parseFloat(bVal);
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
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
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
    } catch (err) { console.error("PNG export failed:", err); }
  };

  const handleExportCsv = () => {
    const headers = config.table.columns;
    const csvRows = [headers.join(","), ...filteredRows.map((row) => headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.title.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Chart editing helpers ───────────────────────────────────────────────────
  const handleChartUpdate = useCallback((index: number, updatedChart: ChartConfig) => {
    if (!onConfigChange) return;
    const newCharts = [...config.charts];
    newCharts[index] = updatedChart;
    onConfigChange({ ...config, charts: newCharts });
  }, [config, onConfigChange]);

  const handleChartRemove = useCallback((index: number) => {
    if (!onConfigChange) return;
    if (!confirm("Remove this chart?")) return;
    const newCharts = config.charts.filter((_, i) => i !== index);
    onConfigChange({ ...config, charts: newCharts });
  }, [config, onConfigChange]);

  const handleAddChart = useCallback(() => {
    if (!onConfigChange) return;
    const xAxis = data.headers[0] || "";
    const yAxis = numericColumns[0] || data.headers[1] || "";
    const newChart: ChartConfig = {
      type: "bar",
      title: "New Chart",
      xAxis,
      yAxis,
    };
    onConfigChange({ ...config, charts: [...config.charts, newChart] });
    // Open settings for the new chart
    setEditingChartIndex(config.charts.length);
  }, [config, onConfigChange, data.headers, numericColumns]);

  const handleAISuggest = useCallback(async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, columns: data.headers, numericColumns }),
      });
      if (res.ok) {
        const { suggestions: s } = await res.json();
        setSuggestions(s || []);
      }
    } catch (e) {
      console.error("AI suggest failed:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [config, data.headers, numericColumns]);

  const handleAddSuggestion = useCallback((suggestion: ChartSuggestion) => {
    if (!onConfigChange) return;
    const { reason, ...chartConfig } = suggestion;
    onConfigChange({ ...config, charts: [...config.charts, chartConfig] });
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  }, [config, onConfigChange]);

  // Editing chart
  const editingChart = editingChartIndex !== null ? config.charts[editingChartIndex] ?? null : null;

  return (
    <div className="space-y-7 transition-colors duration-200" ref={dashboardRef}>
      {/* ── Header ── */}
      <div className="chart-animate" style={{ animationDelay: "0ms" }}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{config.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.description}</p>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} rawNumber={stat.rawNumber}
            change={stat.change} trend={stat.trend} icon={stat.icon} sparklineData={stat.sparklineData}
            colorIndex={i} animDelay={i * 60} />
        ))}
      </div>

      {/* ── AI Insights ── */}
      {config.insights.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm chart-animate" style={{ animationDelay: "240ms" }}>
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
      {(config.charts.length > 0 || isEditMode) && (
        <div>
          <div className={`grid gap-5 ${config.charts.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
            {config.charts.map((chart, i) => (
              <ChartCard
                key={i}
                chart={chart}
                data={data.rows}
                index={i}
                isEditMode={isEditMode}
                onEdit={() => setEditingChartIndex(i)}
                onRemove={() => handleChartRemove(i)}
              />
            ))}
          </div>

          {/* ── Edit mode actions ── */}
          {isEditMode && (
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-gray-200 dark:border-white/10 border-dashed">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddChart}
                className="gap-2 text-sm border-dashed border-gray-300 dark:border-white/20 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600"
              >
                <Plus className="h-4 w-4" />
                Add Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={loadingSuggestions}
                className="gap-2 text-sm border-dashed border-gray-300 dark:border-white/20 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600"
              >
                {loadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI Suggest
              </Button>
            </div>
          )}

          {/* ── AI Suggestions Panel ── */}
          {isEditMode && showSuggestions && (
            <div className="mt-4 rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/30 dark:bg-purple-950/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">AI Chart Suggestions</h3>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Analyzing your data for insights...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No suggestions available. Try adding more data or charts first.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {suggestions.map((s, i) => (
                    <SuggestionCard
                      key={i}
                      suggestion={s}
                      index={config.charts.length + i}
                      onAdd={() => handleAddSuggestion(s)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Data Table ── */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm rounded-xl chart-animate" style={{ animationDelay: `${(config.charts.length + 2) * 80}ms` }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Data
                {showTable && (
                  <span className="ml-2 text-xs font-normal text-gray-400">{filteredRows.length} rows{filteredRows.length > 100 ? " (showing first 100)" : ""}</span>
                )}
              </CardTitle>
              {/* Table visibility toggle */}
              <button
                onClick={handleToggleTable}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title={showTable ? "Hide table" : "Show table"}
              >
                {showTable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {showTable && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input placeholder="Search..." className="pl-9 w-[180px] text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadPng}><Camera className="h-4 w-4 mr-1" />PNG</Button>
                <Button variant="outline" size="sm" onClick={handleExportCsv}><Download className="h-4 w-4 mr-1" />Export</Button>
              </div>
            )}
          </div>
        </CardHeader>
        {showTable && (
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
                          {sortCol === col ? <span className="text-orange-500">{sortDir === "asc" ? "↑" : "↓"}</span> : <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-30" />}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.slice(0, 100).map((row, rowIdx) => (
                    <TableRow key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-white/5 even:bg-gray-50/40 dark:even:bg-white/[0.02]">
                      {config.table.columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap py-2.5">
                          {col === config.table.statusField && config.table.statusOptions ? (
                            <StatusBadge value={row[col] || ""} options={config.table.statusOptions} onChange={(v) => handleStatusChange(rowIdx, col, v)} />
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
            {filteredRows.length > 100 && <p className="text-xs text-gray-400 mt-2 text-center">Showing 100 of {filteredRows.length} rows</p>}
          </CardContent>
        )}
      </Card>

      {/* ── Chart Settings Dialog ── */}
      <ChartSettingsDialog
        open={editingChartIndex !== null}
        chart={editingChart}
        index={editingChartIndex ?? 0}
        headers={data.headers}
        rows={data.rows}
        onSave={(updated) => {
          if (editingChartIndex !== null) handleChartUpdate(editingChartIndex, updated);
        }}
        onClose={() => setEditingChartIndex(null)}
      />
    </div>
  );
}
