import { NextRequest, NextResponse } from "next/server";

// Extract Google Sheets ID from URL
function extractSheetId(url: string): string | null {
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /key=([a-zA-Z0-9-_]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { url } = body;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const sheetId = extractSheetId(url);
    if (!sheetId) {
      return NextResponse.json({ error: "Could not extract Google Sheets ID from URL" }, { status: 400 });
    }

    // Fetch as CSV using the public export URL
    // This only works for sheets that are shared as "Anyone with the link"
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(csvUrl, { redirect: "follow" });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "This sheet is not publicly accessible. Make sure it's shared as 'Anyone with the link'" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch sheet (HTTP ${response.status})` },
        { status: 502 }
      );
    }

    const csvString = await response.text();

    if (!csvString || csvString.length < 10) {
      return NextResponse.json({ error: "Sheet appears to be empty" }, { status: 400 });
    }

    return NextResponse.json({ csvString });
  } catch (error) {
    console.error("Sheets error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import sheet" },
      { status: 500 }
    );
  }
}
