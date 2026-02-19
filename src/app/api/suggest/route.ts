import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { ChartConfig } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, columns, numericColumns } = body;

    if (!config || !columns) {
      return NextResponse.json({ error: "config and columns are required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const ai = new GoogleGenAI({ apiKey });

    const existingCharts = (config.charts as ChartConfig[])
      .map((c) => `${c.type}: "${c.title}" (x: ${c.xAxis}, y: ${c.yAxis})`)
      .join("; ");

    const prompt = `You are a data visualization expert. Given these existing charts: [${existingCharts}], and these columns: [${(columns as string[]).join(", ")}] (numeric columns: [${(numericColumns as string[]).join(", ")}]), suggest 2-3 additional charts that would reveal insights NOT yet visible in the existing charts.

Rules:
- Only use column names EXACTLY as provided in the columns list
- Numeric Y axis required for bar/area charts
- Do NOT duplicate existing chart types AND axes combinations
- Suggest charts that tell a different story from existing ones
- Be insightful — pick combinations that reveal correlations, distributions, or rankings not yet shown
- Each suggestion needs a brief "reason" explaining the insight it reveals`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object" as const,
          properties: {
            suggestions: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  type: { type: "string" as const, enum: ["bar", "pie", "area", "horizontalBar"] },
                  title: { type: "string" as const },
                  xAxis: { type: "string" as const },
                  yAxis: { type: "string" as const },
                  reason: { type: "string" as const },
                },
                required: ["type", "title", "xAxis", "yAxis", "reason"],
              },
            },
          },
          required: ["suggestions"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const parsed = JSON.parse(text);
    const suggestions = parsed.suggestions || [];

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    console.error("Suggest error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Suggestion failed" },
      { status: 500 }
    );
  }
}
