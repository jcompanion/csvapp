import { GoogleGenAI } from "@google/genai";

export interface ChartConfig {
  type: "bar" | "pie" | "area" | "horizontalBar";
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
          type: { type: "string" as const, enum: ["bar", "pie", "area", "horizontalBar"] },
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

Rules:
- If hierarchical (has "reports_to", "parent", "manager", or similar) → set suggestedView to "orgChart" and fill orgChart config
- If has a status/stage column → set suggestedView to "kanban" or "dashboard" with actionable table
- If has date + numeric columns → include time series chart (use "area" type, not "line")
- If categorical + numeric → include bar or pie chart. Use horizontalBar for ranked lists (e.g. "top products by revenue", "deals by rep")
- Generate 2-3 plain-English insights about what you see in the data
- Pick an accent color that fits the data theme (e.g., green for finance, blue for tech)
- Always include a table config with all columns
- Only suggest charts where the data types make sense (numeric Y axis required)
- Maximum 4 charts`;

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

  return JSON.parse(text) as DashboardConfig;
}
