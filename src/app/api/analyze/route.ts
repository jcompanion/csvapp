import { NextRequest, NextResponse } from "next/server";
import { parseCsvString } from "@/lib/csv-parser";
import { analyzeCsvWithGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { csvString, totalRows: clientTotalRows } = body;

    if (!csvString || typeof csvString !== "string") {
      return NextResponse.json(
        { error: "csvString is required" },
        { status: 400 }
      );
    }

    // Parse CSV (may be truncated — client sends first 100 rows for analysis)
    const parsed = parseCsvString(csvString);
    const actualTotalRows = clientTotalRows || parsed.totalRows;

    if (parsed.headers.length === 0 || parsed.totalRows === 0) {
      return NextResponse.json(
        { error: "CSV appears to be empty or invalid" },
        { status: 400 }
      );
    }

    // Send to Gemini for analysis
    const config = await analyzeCsvWithGemini(
      parsed.headers,
      parsed.rows,
      actualTotalRows
    );

    return NextResponse.json({
      config,
      data: {
        headers: parsed.headers,
        rows: parsed.rows,
        totalRows: parsed.totalRows,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
