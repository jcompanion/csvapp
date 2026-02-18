"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvUploadProps {
  onAnalyzed: (result: { config: any; data: any }) => void;
}

export function CsvUpload({ onAnalyzed }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      setIsLoading(true);

      try {
        const text = await file.text();

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvString: text }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Analysis failed");
        }

        const result = await response.json();
        onAnalyzed(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsLoading(false);
      }
    },
    [onAnalyzed]
  );

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

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
        isDragging
          ? "border-emerald-400/50 bg-emerald-500/5"
          : isLoading
          ? "border-white/10 bg-white/[0.02]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
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
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold">Analyzing {fileName}...</p>
            <p className="text-sm text-muted-foreground mt-1">
              AI is reading your data and building the perfect dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Usually takes 2-5 seconds
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            {fileName ? (
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold">
              {fileName || "Drop your CSV here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse — we&apos;ll handle the rest
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:opacity-90 transition-opacity"
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
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
