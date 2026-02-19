import { GoogleGenAI } from "@google/genai";

export interface ChartConfig {
  type: "bar" | "pie" | "area" | "horizontalBar" | "line";
  title: string;
  xAxis: string;
  yAxis: string;
  color?: string;
}

export interface DashboardConfig {
  title: string;
  description: string;
  suggestedView: "dashboard" | "orgChart" | "kanban" | "table";
  charts: ChartConfig[];
  table: {
    columns: string[];
    sortBy?: string;
    statusField?: string;
    statusOptions?: string[];
  };
  orgChart?: {
    nameField: string;
    titleField?: string;
    parentField: string;
    departmentField?: string;
    descriptionField?: string;
  } | null;
  insights: string[];
  accentColor: string;
  showTable?: boolean;
}

const responseSchema = {
  type: "object" as const,
  properties: {
    title: { type: "string" as const },
    description: { type: "string" as const },
    suggestedView: {
      type: "string" as const,
      enum: ["dashboard", "orgChart", "kanban", "table"],
    },
    charts: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          type: { type: "string" as const, enum: ["bar", "pie", "horizontalBar"] },
          title: { type: "string" as const },
          xAxis: { type: "string" as const },
          yAxis: { type: "string" as const },
          color: { type: "string" as const },
        },
        required: ["type", "title", "xAxis", "yAxis"],
      },
    },
    table: {
      type: "object" as const,
      properties: {
        columns: { type: "array" as const, items: { type: "string" as const } },
        sortBy: { type: "string" as const },
        statusField: { type: "string" as const },
        statusOptions: { type: "array" as const, items: { type: "string" as const } },
      },
      required: ["columns"],
    },
    orgChart: {
      type: "object" as const,
      nullable: true,
      properties: {
        nameField: { type: "string" as const },
        titleField: { type: "string" as const },
        parentField: { type: "string" as const },
        departmentField: { type: "string" as const },
        descriptionField: { type: "string" as const },
      },
      required: ["nameField", "parentField"],
    },
    insights: { type: "array" as const, items: { type: "string" as const } },
    accentColor: { type: "string" as const },
  },
  required: [
    "title",
    "description",
    "suggestedView",
    "charts",
    "table",
    "insights",
    "accentColor",
  ],
};

export async function analyzeCsvWithGemini(
  headers: string[],
  sampleRows: Record<string, string>[],
  totalRows: number
): Promise<DashboardConfig> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a data visualization expert. Given a CSV with these headers and sample data, output a JSON config for the best way to visualize this data.

Headers: ${JSON.stringify(headers)}
Sample rows (first 5): ${JSON.stringify(sampleRows.slice(0, 5), null, 2)}
Total rows: ${totalRows}

CRITICAL RULES:
- Chart xAxis and yAxis values MUST be EXACT column names from the Headers array above. Copy them exactly, character-for-character. Do NOT invent column names.
- Chart types allowed: "bar", "pie", "horizontalBar" ONLY. Never use "line" or "area".
- yAxis MUST reference a column containing numeric data (numbers, currency like $50, percentages like 45%).
- xAxis should be a categorical or date column (names, categories, dates, months).
- If a column has text/names, it goes in xAxis. If it has numbers, it goes in yAxis.
- If hierarchical (has "reports_to", "parent", "manager", or similar) → set suggestedView to "orgChart" and fill orgChart config with EXACT column names
- If has a status/stage column → set suggestedView to "kanban" or "dashboard" with actionable table
- Use "bar" for time series and comparisons. Use "horizontalBar" for ranked lists. Use "pie" for proportions/distributions (max 8 categories).
- Generate 2-3 plain-English insights about what you see in the data
- Pick an accent color that fits the data theme (e.g., green for finance, blue for tech)
- Always include a table config with ALL columns from the Headers array
- Maximum 4 charts. Each chart MUST have valid xAxis and yAxis from the Headers.
- DOUBLE CHECK: every xAxis and yAxis value must appear exactly in this list: ${JSON.stringify(headers)}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: responseSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");

  const config = JSON.parse(text) as DashboardConfig;

  // ── Validate and fix charts ──────────────────────────────────────────────
  const headerSet = new Set(headers);
  const headerLower = new Map(headers.map(h => [h.toLowerCase(), h]));

  // Fix column name mismatches (case-insensitive fuzzy match)
  function resolveColumn(col: string): string | null {
    if (!col) return null;
    if (headerSet.has(col)) return col;
    // Case-insensitive match
    const lower = col.toLowerCase();
    if (headerLower.has(lower)) return headerLower.get(lower)!;
    // Underscore/space normalization
    const normalized = lower.replace(/[_\s-]+/g, "");
    for (const [hLower, hOriginal] of headerLower) {
      if (hLower.replace(/[_\s-]+/g, "") === normalized) return hOriginal;
    }
    // Partial match (column name contains or is contained by)
    for (const [hLower, hOriginal] of headerLower) {
      if (hLower.includes(lower) || lower.includes(hLower)) return hOriginal;
    }
    return null;
  }

  // Detect numeric columns from sample data
  function isNumeric(colName: string): boolean {
    const vals = sampleRows.slice(0, 10).map(r => r[colName]).filter(Boolean);
    if (vals.length === 0) return false;
    const numCount = vals.filter(v => {
      const cleaned = v.replace(/[$,%]/g, "").replace(/,/g, "").trim();
      return !isNaN(parseFloat(cleaned));
    }).length;
    return numCount > vals.length * 0.4;
  }

  const numericCols = headers.filter(h => isNumeric(h));
  const categoryCols = headers.filter(h => !isNumeric(h));

  // Validate each chart
  config.charts = config.charts
    .map(chart => {
      // Remap unsupported types
      if (chart.type === "line" || chart.type === "area") {
        chart.type = "bar";
      }
      if (!["bar", "pie", "horizontalBar"].includes(chart.type)) {
        chart.type = "bar";
      }

      // Resolve column names
      const xResolved = resolveColumn(chart.xAxis);
      const yResolved = resolveColumn(chart.yAxis);

      if (xResolved) chart.xAxis = xResolved;
      if (yResolved) chart.yAxis = yResolved;

      // If yAxis isn't numeric, try to swap or find a numeric column
      if (chart.yAxis && !isNumeric(chart.yAxis) && chart.xAxis && isNumeric(chart.xAxis)) {
        // Swap — Gemini got them backwards
        [chart.xAxis, chart.yAxis] = [chart.yAxis, chart.xAxis];
      } else if (chart.yAxis && !isNumeric(chart.yAxis) && numericCols.length > 0) {
        // yAxis isn't numeric, pick the first available numeric column
        chart.yAxis = numericCols[0];
      }

      return chart;
    })
    .filter(chart => {
      // Only keep charts with valid, resolved columns
      const xValid = chart.xAxis && headerSet.has(chart.xAxis);
      const yValid = chart.yAxis && headerSet.has(chart.yAxis);
      return xValid && yValid;
    });

  // If no charts survived validation, generate sensible defaults
  if (config.charts.length === 0 && numericCols.length > 0 && categoryCols.length > 0) {
    config.charts = numericCols.slice(0, 3).map((numCol, i) => ({
      type: "bar" as const,
      title: `${numCol} by ${categoryCols[0]}`,
      xAxis: categoryCols[0],
      yAxis: numCol,
    }));
  } else if (config.charts.length === 0 && numericCols.length >= 2) {
    // All numeric — use first as x, rest as y
    config.charts = numericCols.slice(1, 4).map((numCol) => ({
      type: "bar" as const,
      title: `${numCol} by ${numericCols[0]}`,
      xAxis: numericCols[0],
      yAxis: numCol,
    }));
  }

  // Validate table columns
  if (config.table?.columns) {
    config.table.columns = config.table.columns
      .map(c => resolveColumn(c) || c)
      .filter(c => headerSet.has(c));
    if (config.table.columns.length === 0) {
      config.table.columns = headers;
    }
  } else {
    config.table = { columns: headers };
  }

  // Validate insights
  if (!config.insights || !Array.isArray(config.insights) || config.insights.length === 0) {
    config.insights = ["Data loaded successfully with " + totalRows + " rows."];
  }

  return config;
}
