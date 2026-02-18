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
} from "lucide-react";
import type { DashboardConfig, ChartConfig } from "@/lib/gemini";

interface DashboardViewProps {
  config: DashboardConfig;
  data: {
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
  };
}

const CHART_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
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
    complete: "bg-green-500/15 text-green-400 border-green-500/30",
    completed: "bg-green-500/15 text-green-400 border-green-500/30",
    done: "bg-green-500/15 text-green-400 border-green-500/30",
    active: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "in progress": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    reviewed: "bg-green-500/15 text-green-400 border-green-500/30",
    "closed won": "bg-green-500/15 text-green-400 border-green-500/30",
    negotiation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "proposal sent": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    discovery: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "in review": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    todo: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
    backlog: "bg-neutral-500/15 text-neutral-500 border-neutral-500/30",
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
    "closed lost": "bg-red-500/15 text-red-400 border-red-500/30",
    closed: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
  };

  const colorClass =
    colorMap[value.toLowerCase()] ||
    "bg-neutral-500/15 text-neutral-400 border-neutral-500/30";

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

function ChartCard({ chart, data, accentColor, index }: { chart: ChartConfig; data: Record<string, string>[]; accentColor: string; index: number }) {
  // Aggregate data for charts
  const chartData = useMemo(() => {
    if (chart.type === "pie") {
      // Group by xAxis, count or sum yAxis
      const grouped: Record<string, number> = {};
      data.forEach((row) => {
        const key = row[chart.xAxis] || "Unknown";
        const val = parseFloat(row[chart.yAxis]) || 1;
        grouped[key] = (grouped[key] || 0) + val;
      });
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }

    // For bar/line/area, try to use data as-is if xAxis values are unique-ish
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

  // Always use bright colors — ignore Gemini's suggestions (often too dark for dark mode)
  const color = CHART_COLORS[index % CHART_COLORS.length];
  const tooltipStyle = { backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          {chart.type === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} activeDot={{ r: 5, fill: color }} />
            </LineChart>
          ) : chart.type === "area" ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
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
        <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
        <p className="text-muted-foreground mt-1">{config.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{data.totalRows} rows</Badge>
          <Badge variant="secondary">{data.headers.length} columns</Badge>
        </div>
      </div>

      {/* AI Insights */}
      {config.insights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                {config.insights.map((insight, i) => (
                  <p key={i} className="text-sm">{insight}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Data</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {config.table.columns.map((col) => (
                    <TableHead
                      key={col}
                      className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
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
                  <TableRow key={rowIdx}>
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
                          <span className="text-sm">{row[col]}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredRows.length > 100 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Showing 100 of {filteredRows.length} rows
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
