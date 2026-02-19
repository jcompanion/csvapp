"use client";

import { useState } from "react";
import { CsvUpload } from "@/components/csv-upload";
import { DashboardView } from "@/components/dashboard-view";
import {
  FileSpreadsheet,
  Zap,
  Share2,
  BarChart3,
  Users,
  DollarSign,
  ListChecks,
  MessageSquare,
  ArrowRight,
  Check,
  Sparkles,
  Loader2,
  Star,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";

export default function Home() {
  const [result, setResult] = useState<{ config: any; data: any } | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!result) return;
    setSharing(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: result.config, data: result.data }),
      });
      if (res.ok) {
        const { slug } = await res.json();
        const url = `${window.location.origin}/d/${slug}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } finally {
      setSharing(false);
    }
  };

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
        const data = await analyzeRes.json();
        setResult(data);
      }
    } finally {
      setLoadingSample(null);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <header className="border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg text-gray-900 dark:text-white">CSVApp</span>
            </button>
            <div className="flex items-center gap-2">
              <AuthButton />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={sharing}
                className="text-xs gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Copied!
                  </>
                ) : sharing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-3.5 w-3.5" />
                    Share
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setResult(null); setShareUrl(null); }}
                className="text-xs"
              >
                Upload new CSV
              </Button>
            </div>
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
    { name: "Shopify Orders", file: "shopify-orders.csv", icon: FileSpreadsheet },
    { name: "Marketing Campaigns", file: "marketing-campaigns.csv", icon: Zap },
    { name: "Student Grades", file: "student-grades.csv", icon: Star },
  ];

  const testimonials = [
    {
      quote: "I used to spend 30 minutes formatting reports in Excel. Now I just upload the CSV and share the link. My boss thinks I hired a designer.",
      name: "Sarah K.",
      role: "Marketing Manager",
      avatar: "SK",
    },
    {
      quote: "The org chart feature alone saved me hours. Uploaded our team spreadsheet and got a beautiful interactive chart in seconds.",
      name: "James R.",
      role: "VP Engineering",
      avatar: "JR",
    },
    {
      quote: "Finally, a tool that makes my sales data look like a real dashboard instead of a spreadsheet. My team actually reads the reports now.",
      name: "Mike T.",
      role: "Sales Director",
      avatar: "MT",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">CSVApp</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Docs</span>
            <ThemeToggle />
            <Button
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity rounded-full px-4"
            >
              Start free trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 text-sm font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered dashboards from any CSV
          </div>

          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5 text-gray-900 dark:text-white"
            style={{ letterSpacing: "-0.5px" }}
          >
            Your spreadsheet,
            <br />
            made beautiful.
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Upload a CSV, get a live interactive dashboard in{" "}
            <span className="text-orange-500 font-semibold">30 seconds</span>.
            AI picks the perfect charts, tables, and views.
            No setup. No account.
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="flex -space-x-2">
              {["bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-pink-400"].map((bg, i) => (
                <div key={i} className={`h-8 w-8 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                  {["A", "B", "C", "D", "E"][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Loved by <strong className="text-gray-700 dark:text-gray-200">1,000+</strong> users
            </span>
          </div>

          {/* Upload */}
          <div className="max-w-xl mx-auto">
            <CsvUpload onAnalyzed={setResult} />
          </div>

          {/* Sample buttons */}
          <div className="mt-6">
            <p className="text-sm text-gray-400 mb-3">
              No CSV? Try a sample →
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {samples.map((sample) => (
                <Button
                  key={sample.file}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/20 dark:border-white/10 rounded-full"
                  disabled={loadingSample !== null}
                  onClick={() => loadSample(sample.file)}
                >
                  {loadingSample === sample.file ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <sample.icon className="h-3 w-3" />
                  )}
                  {sample.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Screenshot */}
      <section className="pb-8 px-4 -mt-4">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/60 dark:shadow-black/30 border border-gray-200/60 dark:border-white/10">
            <img
              src="/hero-dashboard.jpg"
              alt="CSVApp Sales Pipeline Dashboard"
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3 tracking-tight text-gray-900 dark:text-white">
            Beautiful dashboards in 3 steps
          </h2>
          <p className="text-center text-gray-500 mb-12">
            No design skills needed. AI does the heavy lifting.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "1",
                icon: Upload,
                title: "Upload your CSV",
                desc: "Drag & drop any CSV file. Sales data, org charts, project trackers — anything goes.",
              },
              {
                step: "2",
                icon: Sparkles,
                title: "AI analyzes it",
                desc: "Gemini reads your columns and auto-picks the best charts, KPIs, and views.",
              },
              {
                step: "3",
                icon: Share2,
                title: "Share & interact",
                desc: "Get a beautiful dashboard. Filter, sort, update statuses, and share with one link.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="h-14 w-14 rounded-2xl bg-white border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-orange-50 dark:bg-orange-950/300 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1.5 text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-3 tracking-tight text-gray-900 dark:text-white">
            Stop fighting your spreadsheet
          </h2>
          <p className="text-center text-gray-500 mb-10">
            You deserve better than copy-pasting into Google Slides.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-6">
              <p className="font-semibold text-red-500 mb-4">Without CSVApp</p>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
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

            <div className="rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/30/30 p-6">
              <p className="font-semibold text-orange-600 mb-4">With CSVApp</p>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                {[
                  "Upload CSV, dashboard appears instantly",
                  "AI picks the perfect charts for your data",
                  "Click to update statuses, filter, search",
                  "Looks like a $50K custom dashboard",
                  "30 seconds. Done.",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 px-4 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10 tracking-tight text-gray-900 dark:text-white">
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
              { icon: BarChart3, label: "User Analytics" },
              { icon: FileSpreadsheet, label: "Any CSV" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white p-5 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-sm transition-all"
              >
                <item.icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10 tracking-tight text-gray-900 dark:text-white">
            Loved by data people
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white p-6">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white">
            Ready to make your data beautiful?
          </h2>
          <p className="text-gray-500 mb-8">
            Free while in beta. No account required.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity gap-2 px-8 rounded-full shadow-lg shadow-orange-500/20 dark:shadow-orange-500/10"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Upload your CSV
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex -space-x-2">
              {["bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-pink-400"].map((bg, i) => (
                <div key={i} className={`h-6 w-6 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}>
                  {["A", "B", "C", "D", "E"][i]}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Loved by <strong className="text-gray-700 dark:text-gray-200">1,000+</strong> users
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/5 py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                <FileSpreadsheet className="h-3 w-3 text-white" />
              </div>
              <span>CSVApp</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Pricing</a>
              <a href="mailto:hello@csvapp.com" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact</a>
            </div>
            <p>Built with ☕ and AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
