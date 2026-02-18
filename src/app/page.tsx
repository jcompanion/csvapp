"use client";

import { useState } from "react";
import { CsvUpload } from "@/components/csv-upload";
import { DashboardView } from "@/components/dashboard-view";
import { FileSpreadsheet, Zap, Share2, MousePointerClick, BarChart3, Users, DollarSign, ListChecks, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [result, setResult] = useState<{ config: any; data: any } | null>(null);

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition-opacity"
            >
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              CSVApp
            </button>
            <span className="text-sm text-muted-foreground">
              Upload another CSV to start fresh
            </span>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <DashboardView config={result.config} data={result.data} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">CSVApp</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-2">
            Your spreadsheet, made beautiful.
          </p>
          <p className="text-muted-foreground">
            Upload a CSV → get a live, interactive dashboard in 30 seconds.
            <br />
            AI figures out the best way to show your data. No setup required.
          </p>
        </div>

        {/* Upload */}
        <CsvUpload onAnalyzed={setResult} />

        {/* Sample Data */}
        <div className="mt-10">
          <p className="text-sm text-muted-foreground text-center mb-3">
            No CSV handy? Try a sample:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "Sales Pipeline", file: "sales-pipeline.csv", icon: BarChart3 },
              { name: "Org Chart", file: "org-chart.csv", icon: Users },
              { name: "Monthly Finances", file: "monthly-finances.csv", icon: DollarSign },
              { name: "Project Tracker", file: "project-tracker.csv", icon: ListChecks },
              { name: "Customer Feedback", file: "customer-feedback.csv", icon: MessageSquare },
            ].map((sample) => (
              <Button
                key={sample.file}
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  const res = await fetch(`/samples/${sample.file}`);
                  const text = await res.text();
                  const file = new File([text], sample.file, { type: "text/csv" });
                  // Trigger the upload flow
                  const analyzeRes = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ csvString: text }),
                  });
                  if (analyzeRes.ok) {
                    const result = await analyzeRes.json();
                    setResult(result);
                  }
                }}
              >
                <sample.icon className="h-3.5 w-3.5" />
                {sample.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-3">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Gemini reads your data and auto-suggests the best charts, tables,
              and views.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-3">
              <MousePointerClick className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Interactive</h3>
            <p className="text-sm text-muted-foreground">
              Update statuses, filter, sort, and search. Your CSV becomes a
              living app.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-3">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Shareable</h3>
            <p className="text-sm text-muted-foreground">
              One link. No login required for viewers. Beautiful, not
              &ldquo;spreadsheet-looking.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
