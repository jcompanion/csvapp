"use client";

import { useState, useMemo } from "react";
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
  TrendingUp,
  Hash,
  FileSpreadsheet,
} from "lucide-react";
import type { DashboardConfig, ChartConfig } from "@/lib/gemini";
import { OrgChart } from "@/components/org-chart";

interface DashboardViewProps {
  config: DashboardConfig;
  data: {
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
  };
}

const CHART_COLORS = [
  "#f97316", "#3b82f6", "#22c55e", "#8b5cf6", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#f59e0b", "#6366f1",
];

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
    complete: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    done: "bg-green-100 text-green-700 border-green-200",
    reviewed: "bg-green-100 text-green-700 border-green-200",
    "closed won": "bg-green-100 text-green-700 border-green-200",
    active: "bg-blue-100 text-blue-700 border-blue-200",
    "in progress": "bg-blue-100 text-blue-700 border-blue-200",
    negotiation: "bg-blue-100 text-blue-700 border-blue-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    open: "bg-yellow-100 text-yellow-700 border-yellow-200",
    "proposal sent": "bg-cyan-100 text-cyan-700 border-cyan-200",
    discovery: "bg-purple-100 text-purple-700 border-purple-200",
    "in review": "bg-orange-100 text-orange-700 border-orange-200",
    todo: "bg-gray-100 text-gray-600 border-gray-200 dark:border-white/10",
    backlog: "bg-gray-50 text-gray-500 border-gray-200 dark:border-white/10",
    critical: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    "closed lost": "bg-red-100 text-red-700 border-red-200",
    closed: "bg-gray-100 text-gray-600 border-gray-200 dark:border-white/10",
  };

  const colorClass =
    colorMap[value.toLowerCase()] ||
    "bg-gray-100 text-gray-600 border-gray-200 dark:border-white/10";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          <Badge
            variant="outline"
            className={`${colorClass} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            {value}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => onChange(opt)}>
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// KPI stat card
function StatCard({ label, value, change }: { label: string; value: string; change?: string }) {
  const isPositive = change && !change.startsWith("-");
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {change && (
        <p className={`text-xs font-medium mt-1 ${isPositive ? "text-green-600" : "text-red-500"}`}>
          {isPositive ? "↑" : "↓"} {change}
        </p>
      )}
    </div>
  );
}

function ChartCard({ chart, data, accentColor, index }: { chart: ChartConfig; data: Record<string, string>[]; accentColor: string; index: number }) {
  const chartData = useMemo(() => {
    if (chart.type === "pie") {
      const grouped: Record<string, number> = {};
      data.forEach((row) => {
        const key = row[chart.xAxis] || "Unknown";
        const val = parseFloat(row[chart.yAxis]) || 1;
        grouped[key] = (grouped[key] || 0) + val;
      });
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }

    const seen = new Set<string>();
    const deduped: Record<string, string>[] = [];
    data.forEach((row) => {
      const key = row[chart.xAxis];
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      }
    });

    return (deduped.length > 50 ? deduped.slice(0, 50) : deduped).map((row) => ({
      name: row[chart.xAxis] || "",
      value: parseFloat(row[chart.yAxis]) || 0,
    }));
  }, [chart, data]);

  const color = CHART_COLORS[index % CHART_COLORS.length];
  const tooltipStyle = { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#111", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" };

  return (
    <Card className="border-gray-200 dark:border-white/10 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          {chart.type === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.4 }} stroke="currentColor" strokeOpacity={0.15} />
              <YAxis tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.4 }} stroke="currentColor" strokeOpacity={0.15} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.4 }} stroke="currentColor" strokeOpacity={0.15} />
              <YAxis tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.4 }} stroke="currentColor" strokeOpacity={0.15} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ fill: color, stroke: color, r: 4 }} activeDot={{ r: 6, fill: color }} />
            </LineChart>
          ) : chart.type === "area" ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.4 }} stroke="currentColor" strokeOpacity={0.15} />
              <YAxis tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.4 }} stroke="currentColor" strokeOpacity={0.15} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={3} />
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DashboardView({ config, data }: DashboardViewProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(config.table.sortBy || null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});

  // Detect org chart
  const isOrgChart = useMemo(() => {
    const lower = data.headers.map((h) => h.toLowerCase());
    return lower.some((h) => h.includes("reports_to") || h.includes("reportsto") || h.includes("manager") || h.includes("supervisor"));
  }, [data.headers]);

  // Compute KPI stats from data
  const stats = useMemo(() => {
    const result: { label: string; value: string }[] = [];
    result.push({ label: "Total Rows", value: data.totalRows.toLocaleString() });
    result.push({ label: "Columns", value: data.headers.length.toString() });

    // Find numeric columns and compute totals/averages
    const numericCols = data.headers.filter((h) => {
      const vals = data.rows.slice(0, 10).map((r) => r[h]);
      return vals.some((v) => v && !isNaN(parseFloat(v.replace(/[,$%]/g, ""))));
    });

    numericCols.slice(0, 2).forEach((col) => {
      const vals = data.rows.map((r) => parseFloat((r[col] || "0").replace(/[,$%]/g, "")));
      const validVals = vals.filter((v) => !isNaN(v));
      if (validVals.length > 0) {
        const sum = validVals.reduce((a, b) => a + b, 0);
        const isLargeNumbers = sum > 1000;
        result.push({
          label: `Total ${col}`,
          value: isLargeNumbers
            ? `$${(sum / 1000).toFixed(1)}K`
            : sum.toLocaleString(),
        });
      }
    });

    // Count unique status values if status field exists
    if (config.table.statusField) {
      const statuses = new Set(data.rows.map((r) => r[config.table.statusField!]));
      result.push({ label: "Statuses", value: statuses.size.toString() });
    }

    return result.slice(0, 4);
  }, [data, config]);

  const filteredRows = useMemo(() => {
    let rows = data.rows.map((row, i) => ({
      ...row,
      ...overrides[i],
    }));

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) => v?.toLowerCase().includes(q))
      );
    }

    if (sortCol) {
      rows.sort((a, b) => {
        const aVal = a[sortCol] || "";
        const bVal = b[sortCol] || "";
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    return rows;
  }, [data.rows, search, sortCol, sortDir, overrides]);

  const handleStatusChange = (rowIndex: number, column: string, newValue: string) => {
    setOverrides((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], [column]: newValue },
    }));
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{config.title}</h1>
        <p className="text-gray-500 mt-1">{config.description}</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {/* AI Insights */}
      {config.insights.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {config.insights.map((insight, i) => (
                  <p key={i} className="text-sm text-gray-700 dark:text-gray-200">{insight}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Org Chart */}
      {isOrgChart && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Organization</h2>
          <OrgChart data={data.rows} headers={data.headers} />
        </div>
      )}

      {/* Charts */}
      {config.charts.length > 0 && (
        <div className={`grid gap-4 ${config.charts.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {config.charts.map((chart, i) => (
            <ChartCard key={i} chart={chart} data={data.rows} accentColor={config.accentColor} index={i} />
          ))}
        </div>
      )}

      {/* Data Table */}
      <Card className="border-gray-200 dark:border-white/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-900 dark:text-white">Data</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-white/10 overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  {config.table.columns.map((col) => (
                    <TableHead
                      key={col}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 whitespace-nowrap text-gray-600 dark:text-gray-300"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1">
                        {col}
                        {sortCol === col && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.slice(0, 100).map((row, rowIdx) => (
                  <TableRow key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-white/5 dark:bg-gray-800/50">
                    {config.table.columns.map((col) => (
                      <TableCell key={col} className="whitespace-nowrap">
                        {col === config.table.statusField &&
                        config.table.statusOptions ? (
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
