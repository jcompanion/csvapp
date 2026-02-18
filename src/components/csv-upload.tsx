"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
      } finally {
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
    <Card
      className={`relative border-2 border-dashed p-12 text-center transition-all ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
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
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div>
            <p className="text-lg font-medium">Analyzing {fileName}...</p>
            <p className="text-sm text-muted-foreground">
              Gemini is figuring out the best way to visualize your data
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-4">
            {fileName ? (
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">
              {fileName || "Drop your CSV here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse. We&apos;ll turn it into a beautiful dashboard.
            </p>
          </div>
          <Button variant="outline" asChild>
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
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </Card>
  );
}
