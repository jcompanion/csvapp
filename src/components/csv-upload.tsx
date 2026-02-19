"use client";

import { useCallback, useState, useEffect } from "react";
import { Upload, FileSpreadsheet, Loader2, Sparkles, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CsvUploadProps {
  onAnalyzed: (result: { config: any; data: any }) => void;
}

export function CsvUpload({ onAnalyzed }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "sheets">("upload");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  const analyzeCSV = useCallback(
    async (csvString: string) => {
      const messages = [
        "AI is reading your data...",
        "Detecting column types...",
        "Choosing the best charts...",
        "Calculating KPIs...",
        "Building your dashboard...",
        "Almost there...",
      ];
      let msgIdx = 0;
      setLoadingMessage(messages[0]);
      const interval = setInterval(() => {
        msgIdx = Math.min(msgIdx + 1, messages.length - 1);
        setLoadingMessage(messages[msgIdx]);
      }, 1500);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvString }),
      });

      clearInterval(interval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const result = await response.json();
      onAnalyzed(result);
    },
    [onAnalyzed]
  );

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      setIsLoading(true);
      setLoadingMessage("Reading file...");

      try {
        const text = await file.text();
        await analyzeCSV(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsLoading(false);
      }
    },
    [analyzeCSV]
  );

  const handleSheetsImport = useCallback(async () => {
    if (!sheetsUrl.trim()) return;
    setError(null);
    setIsLoading(true);
    setLoadingMessage("Importing from Google Sheets...");

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sheetsUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }

      const { csvString } = await res.json();
      setFileName("Google Sheet");
      await analyzeCSV(csvString);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }, [sheetsUrl, analyzeCSV]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        processFile(file);
      } else {
        setError("Please upload a .csv file");
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // Global paste handler — paste CSV data directly
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const text = e.clipboardData?.getData("text/plain");
      if (text && text.includes(",") && text.includes("\n") && text.split("\n").length > 2) {
        e.preventDefault();
        setFileName("Pasted data");
        setIsLoading(true);
        setError(null);
        analyzeCSV(text).catch((err) => {
          setError(err instanceof Error ? err.message : "Analysis failed");
          setIsLoading(false);
        });
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isLoading, analyzeCSV]);

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex justify-center gap-1 mb-3">
        <button
          onClick={() => setMode("upload")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Upload CSV
        </button>
        <button
          onClick={() => setMode("sheets")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            mode === "sheets"
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Google Sheets
        </button>
      </div>

      {mode === "sheets" ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-8 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-500/30 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-orange-500 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{loadingMessage}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This usually takes 3-8 seconds</p>
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#0F9D58" d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <path fill="#87CEAC" d="M14.5 2v5.5H20" />
                  <rect x="7" y="10" width="10" height="1.5" rx="0.3" fill="white" />
                  <rect x="7" y="13" width="10" height="1.5" rx="0.3" fill="white" />
                  <rect x="7" y="16" width="7" height="1.5" rx="0.3" fill="white" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Paste a Google Sheets URL</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sheet must be shared as &ldquo;Anyone with the link&rdquo;
                </p>
              </div>
              <div className="flex w-full max-w-md gap-2">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSheetsImport()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSheetsImport}
                  disabled={!sheetsUrl.trim()}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity rounded-full px-6"
                >
                  Import
                </Button>
              </div>
              {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
            isDragging
              ? "border-orange-400 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-950/30"
              : isLoading
              ? "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900"
              : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:border-orange-300 dark:hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-500/30 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-orange-500 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{loadingMessage || `Analyzing ${fileName}...`}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  AI is reading your data and building the perfect dashboard
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Usually takes 2-5 seconds
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center">
                {fileName ? (
                  <FileSpreadsheet className="h-6 w-6 text-orange-500" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {fileName || "Drop your CSV here"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse — you can also <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px] font-mono">Ctrl+V</kbd> paste
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity rounded-full px-6"
                asChild
              >
                <label className="cursor-pointer">
                  Choose File
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </Button>
              {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
