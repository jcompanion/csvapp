import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export function parseCsvString(csvString: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // keep everything as strings for now
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data,
    totalRows: result.data.length,
  };
}

export function detectColumnTypes(
  headers: string[],
  rows: Record<string, string>[]
): Record<string, "string" | "number" | "date"> {
  const types: Record<string, "string" | "number" | "date"> = {};
  const sample = rows.slice(0, 20);

  for (const header of headers) {
    const values = sample.map((r) => r[header]).filter(Boolean);
    
    // Check if numeric
    const numericCount = values.filter((v) => !isNaN(Number(v)) && v.trim() !== "").length;
    if (numericCount > values.length * 0.7) {
      types[header] = "number";
      continue;
    }

    // Check if date
    const dateCount = values.filter((v) => !isNaN(Date.parse(v))).length;
    if (dateCount > values.length * 0.7) {
      types[header] = "date";
      continue;
    }

    types[header] = "string";
  }

  return types;
}
