import { NextRequest, NextResponse } from "next/server";
import { parseCsvString } from "@/lib/csv-parser";
import { analyzeCsvWithGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvString } = body;

    if (!csvString || typeof csvString !== "string") {
      return NextResponse.json(
        { error: "csvString is required" },
        { status: 400 }
      );
    }

    // Parse CSV
    const parsed = parseCsvString(csvString);

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
      parsed.totalRows
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
