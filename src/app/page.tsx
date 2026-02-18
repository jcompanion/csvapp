"use client";

import { useState } from "react";
import { CsvUpload } from "@/components/csv-upload";
import { DashboardView } from "@/components/dashboard-view";
import {
  FileSpreadsheet,
  Zap,
  Share2,
  MousePointerClick,
  BarChart3,
  Users,
  DollarSign,
  ListChecks,
  MessageSquare,
  ArrowRight,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [result, setResult] = useState<{ config: any; data: any } | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const loadSample = async (file: string) => {
    setLoadingSample(file);
    try {
      const res = await fetch(`/samples/${file}`);
      const text = await res.text();
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvString: text }),
      });
      if (analyzeRes.ok) {
        const result = await analyzeRes.json();
        setResult(result);
      }
    } finally {
      setLoadingSample(null);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4 text-black" />
              </div>
              <span className="text-lg">CSVApp</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResult(null)}
              className="text-xs"
            >
              Upload new CSV
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <DashboardView config={result.config} data={result.data} />
        </main>
      </div>
    );
  }

  const samples = [
    { name: "Sales Pipeline", file: "sales-pipeline.csv", icon: BarChart3 },
    { name: "Org Chart", file: "org-chart.csv", icon: Users },
    { name: "Monthly Finances", file: "monthly-finances.csv", icon: DollarSign },
    { name: "Project Tracker", file: "project-tracker.csv", icon: ListChecks },
    { name: "Customer Feedback", file: "customer-feedback.csv", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold text-lg">CSVApp</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Free while in beta
          </Badge>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Powered by AI — just upload and watch
          </div>

          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5"
            style={{ letterSpacing: "-0.4px" }}
          >
            Your spreadsheet,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              made beautiful.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Upload a CSV → get a live, interactive dashboard in{" "}
            <span className="text-emerald-400 font-semibold">30 seconds</span>.
            AI figures out the best charts, tables, and views.
            No setup. No account. Just data → beauty.
          </p>

          {/* Upload */}
          <div className="max-w-xl mx-auto">
            <CsvUpload onAnalyzed={setResult} />
          </div>

          {/* Sample buttons */}
          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-3">
              No CSV? Try a sample →
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {samples.map((sample) => (
                <Button
                  key={sample.file}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs hover:bg-white/5 border border-transparent hover:border-white/10"
                  disabled={loadingSample !== null}
                  onClick={() => loadSample(sample.file)}
                >
                  {loadingSample === sample.file ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <sample.icon className="h-3 w-3 text-muted-foreground" />
                  )}
                  {sample.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: FileSpreadsheet,
                title: "Upload your CSV",
                desc: "Drag & drop any CSV file. Sales data, org charts, project trackers — anything.",
              },
              {
                step: "2",
                icon: Sparkles,
                title: "AI analyzes your data",
                desc: "Gemini reads your columns and auto-picks the best charts, tables, and views.",
              },
              {
                step: "3",
                icon: Share2,
                title: "Share & interact",
                desc: "Get a beautiful dashboard. Update statuses, filter, sort, and share with one link.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-emerald-400 text-black text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features comparison */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-4 tracking-tight">
            Stop fighting your spreadsheet
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            You deserve better than copy-pasting into Google Slides.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <p className="font-semibold text-red-400 mb-4">Without CSVApp</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Export CSV, open Excel, fight with charts",
                  "Manually format for stakeholders",
                  "No one can interact with the data",
                  "Looks like a spreadsheet (because it is)",
                  "30+ minutes per report",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-red-400 shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* With */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6">
              <p className="font-semibold text-emerald-400 mb-4">With CSVApp</p>
              <ul className="space-y-3 text-sm">
                {[
                  "Upload CSV, dashboard appears instantly",
                  "AI picks the perfect charts for your data",
                  "Click to update statuses, filter, search",
                  "Looks like a $50K custom dashboard",
                  "30 seconds. Done.",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">
            Works with any data
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, label: "Sales & Revenue" },
              { icon: Users, label: "Org Charts" },
              { icon: ListChecks, label: "Project Tracking" },
              { icon: MessageSquare, label: "Customer Feedback" },
              { icon: DollarSign, label: "Financial Reports" },
              { icon: Zap, label: "Marketing Data" },
              { icon: MousePointerClick, label: "User Analytics" },
              { icon: FileSpreadsheet, label: "Any CSV" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">
            Ready to make your data{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              beautiful
            </span>
            ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Free while in beta. No account required.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:opacity-90 transition-opacity gap-2 px-8"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Upload your CSV
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <FileSpreadsheet className="h-3 w-3 text-black" />
            </div>
            <span>CSVApp</span>
          </div>
          <p>Built with ☕ and AI</p>
        </div>
      </footer>
    </div>
  );
}
