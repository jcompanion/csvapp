"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Save,
  PenLine,
  Eye,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { DashboardConfig } from "@/lib/gemini";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [result, setResult] = useState<{ config: DashboardConfig; data: any } | null>(null);
  const [localConfig, setLocalConfig] = useState<DashboardConfig | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDirtyRef = useRef(false);
  // Stores latest inline-edited rows separately so result.data stays as original
  const editedDataRef = useRef<Record<string, string>[] | null>(null);

  const supabase = getSupabaseBrowser();

  // ─── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Auto-load template from URL param ───────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const template = params.get("template");
    if (template && !result) {
      loadSample(template);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // ─── beforeunload warning ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // ─── Auto-save when dashboard is generated and user is logged in ──────────
  const autoSaveDashboard = useCallback(async (config: DashboardConfig, data: any) => {
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, data }),
      });
      if (res.ok) {
        const { slug } = await res.json();
        const url = `${window.location.origin}/d/${slug}`;
        setSavedSlug(slug);
        setShareUrl(url);
        setAutoSaved(true);
        setIsDirty(false);
        setTimeout(() => setAutoSaved(false), 3000);
      }
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  }, []);

  // ─── Manual save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!result || !localConfig) return;
    setSaving(true);
    try {
      // Use editedDataRef rows if the user has made inline edits
      const dataToSave = editedDataRef.current
        ? { ...result.data, rows: editedDataRef.current }
        : result.data;
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: localConfig,
          data: dataToSave,
          existingSlug: savedSlug,
        }),
      });
      if (res.ok) {
        const { slug } = await res.json();
        const url = `${window.location.origin}/d/${slug}`;
        setSavedSlug(slug);
        setShareUrl(url);
        setIsDirty(false);
        // Copy to clipboard
        await navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Inline data change callback ─────────────────────────────────────────
  const handleDataChange = useCallback((newRows: Record<string, string>[]) => {
    editedDataRef.current = newRows;
    setIsDirty(true);
  }, []);

  // ─── Share (save + copy link) ─────────────────────────────────────────────
  const handleShare = async () => {
    if (!result || !localConfig) return;
    if (shareUrl && !isDirty) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      return;
    }
    await handleSave();
  };

  // ─── Config change callback ───────────────────────────────────────────────
  const handleConfigChange = useCallback((newConfig: DashboardConfig) => {
    setLocalConfig(newConfig);
    setIsDirty(true);
  }, []);

  // ─── Result set: initialize localConfig + auto-save if logged in ──────────
  const handleResultSet = useCallback(async (newResult: { config: DashboardConfig; data: any }) => {
    setResult(newResult);
    setLocalConfig(newResult.config);
    setIsDirty(false);
    setSavedSlug(null);
    setShareUrl(null);
    setIsEditMode(false);
    editedDataRef.current = null; // clear any previous inline edits

    // Re-check auth fresh (user might have just signed in)
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      await autoSaveDashboard(newResult.config, newResult.data);
    }
  }, [supabase, autoSaveDashboard]);

  const loadSample = async (file: string) => {
    setLoadingSample(file);
    try {
      const res = await fetch(`/samples/${file}`);
      const text = await res.text();
      const lines = text.split("\n");
      const truncatedCsv = lines.slice(0, 101).join("\n");
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvString: truncatedCsv, totalRows: lines.length - 1 }),
      });
      if (analyzeRes.ok) {
        const data = await analyzeRes.json();
        const newResult = {
          ...data,
          data: { ...data.data, rows: data.data.rows, totalRows: lines.length - 1 },
        };
        await handleResultSet(newResult);
      }
    } finally {
      setLoadingSample(null);
    }
  };

  if (result && localConfig) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <header className="border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
            <button
              onClick={() => {
                if (isDirty && !confirm("You have unsaved changes. Leave anyway?")) return;
                setResult(null);
                setLocalConfig(null);
                setIsDirty(false);
                setSavedSlug(null);
                setShareUrl(null);
                setIsEditMode(false);
              }}
              className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg text-gray-900 dark:text-white">CSVApp</span>
            </button>

            <div className="flex items-center gap-1.5">
              <AuthButton />
              <ThemeToggle />

              {/* Edit mode toggle */}
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode((prev) => !prev)}
                className={`text-xs gap-1.5 ${isEditMode ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" : ""}`}
              >
                {isEditMode ? <Eye className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isEditMode ? "Done" : "Edit"}</span>
              </Button>

              {/* Save button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className={`text-xs gap-1.5 relative ${isDirty ? "border-orange-400 text-orange-600 dark:text-orange-400" : ""}`}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : copied && !isDirty ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{saving ? "Saving..." : copied && !isDirty ? "Saved!" : "Save"}</span>
                {isDirty && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500" />
                )}
              </Button>

              {/* Share button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={saving}
                className="text-xs gap-1.5"
              >
                {copied && !isDirty ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isDirty && !confirm("You have unsaved changes. Leave anyway?")) return;
                  setResult(null); setLocalConfig(null); setIsDirty(false);
                  setSavedSlug(null); setShareUrl(null); setIsEditMode(false);
                }}
                className="text-xs gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upload new CSV</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Auto-saved banner */}
        {autoSaved && (
          <div className="bg-green-50 dark:bg-green-950/30 border-b border-green-100 dark:border-green-900/40 px-4 py-2">
            <div className="container mx-auto max-w-6xl flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-400">Dashboard auto-saved to your account</span>
              {shareUrl && (
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 dark:text-green-400 underline ml-2 font-medium">
                  View →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Sign-in to save banner (only when not logged in, not already saved) */}
        {!user && !savedSlug && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 px-4 py-2">
            <div className="container mx-auto max-w-6xl flex items-center gap-2">
              <LogIn className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm text-blue-700 dark:text-blue-400">Sign in to save your dashboard and access it later</span>
            </div>
          </div>
        )}

        {/* Unsaved changes indicator */}
        {isDirty && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 px-4 py-1.5">
            <div className="container mx-auto max-w-6xl flex items-center justify-between gap-2">
              <span className="text-xs text-orange-600 dark:text-orange-400">Unsaved changes</span>
              <button onClick={handleSave} disabled={saving} className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                {saving ? "Saving..." : "Save now →"}
              </button>
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <DashboardView
            config={localConfig}
            data={result.data}
            isEditMode={isEditMode}
            onConfigChange={handleConfigChange}
            onDataChange={handleDataChange}
          />
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
      name: "Sarah K.", role: "Marketing Manager", avatar: "SK",
    },
    {
      quote: "The org chart feature alone saved me hours. Uploaded our team spreadsheet and got a beautiful interactive chart in seconds.",
      name: "James R.", role: "VP Engineering", avatar: "JR",
    },
    {
      quote: "Finally, a tool that makes my sales data look like a real dashboard instead of a spreadsheet. My team actually reads the reports now.",
      name: "Mike T.", role: "Sales Director", avatar: "MT",
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
          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-4">
            <a href="/templates" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Templates</a>
            <a href="/pricing" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
            <a href="/my" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">My Dashboards</a>
            <AuthButton />
            <ThemeToggle />
          </div>
          {/* Mobile: auth + theme + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <AuthButton />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-100 dark:border-white/5 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl px-4 py-2">
            <a href="/templates" className="flex items-center px-3 py-3 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Templates</a>
            <a href="/pricing" className="flex items-center px-3 py-3 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="/my" className="flex items-center px-3 py-3 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>My Dashboards</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 text-sm font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered dashboards from any CSV
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5 text-gray-900 dark:text-white" style={{ letterSpacing: "-0.5px" }}>
            Your spreadsheet,<br />made beautiful.
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Upload a CSV, get a live interactive dashboard in{" "}
            <span className="text-orange-500 font-semibold">30 seconds</span>.
            AI picks the perfect charts, tables, and views. No setup. No account.
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
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loved by <strong className="text-gray-700 dark:text-gray-200">1,000+</strong> users
            </span>
          </div>

          {/* Upload */}
          <div className="max-w-xl mx-auto">
            <CsvUpload onAnalyzed={handleResultSet} />
          </div>

          {/* Sample buttons */}
          <div className="mt-6">
            <p className="text-sm text-gray-400 mb-3">No CSV? Try a sample →</p>
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
                  {loadingSample === sample.file ? <Loader2 className="h-3 w-3 animate-spin" /> : <sample.icon className="h-3 w-3" />}
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
            <img src="/hero-dashboard.jpg" alt="CSVApp Sales Pipeline Dashboard" className="w-full h-auto" loading="eager" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3 tracking-tight text-gray-900 dark:text-white">Beautiful dashboards in 3 steps</h2>
          <p className="text-center text-gray-500 mb-12">No design skills needed. AI does the heavy lifting.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "1", icon: Upload, title: "Upload your CSV", desc: "Drag & drop any CSV file. Sales data, org charts, project trackers — anything goes." },
              { step: "2", icon: Sparkles, title: "AI analyzes it", desc: "Gemini reads your columns and auto-picks the best charts, KPIs, and views." },
              { step: "3", icon: Share2, title: "Share & interact", desc: "Get a beautiful dashboard. Filter, sort, update statuses, and share with one link." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="h-14 w-14 rounded-2xl bg-white border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-white text-xs font-bold flex items-center justify-center shadow-sm">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-1.5 text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-3 tracking-tight text-gray-900 dark:text-white">Stop fighting your spreadsheet</h2>
          <p className="text-center text-gray-500 mb-10">You deserve better than copy-pasting into Google Slides.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-6">
              <p className="font-semibold text-red-500 mb-4">Without CSVApp</p>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                {["Export CSV, open Excel, fight with charts", "Manually format for stakeholders", "No one can interact with the data", "Looks like a spreadsheet (because it is)", "30+ minutes per report"].map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/30 p-6">
              <p className="font-semibold text-orange-600 mb-4">With CSVApp</p>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                {["Upload CSV, dashboard appears instantly", "AI picks the perfect charts for your data", "Click to update statuses, filter, search", "Looks like a $50K custom dashboard", "30 seconds. Done."].map((item) => (
                  <li key={item} className="flex gap-2"><Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 px-4 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10 tracking-tight text-gray-900 dark:text-white">Works with any data</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, label: "Sales & Revenue" }, { icon: Users, label: "Org Charts" },
              { icon: ListChecks, label: "Project Tracking" }, { icon: MessageSquare, label: "Customer Feedback" },
              { icon: DollarSign, label: "Financial Reports" }, { icon: Zap, label: "Marketing Data" },
              { icon: BarChart3, label: "User Analytics" }, { icon: FileSpreadsheet, label: "Any CSV" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white p-5 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-sm transition-all">
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
          <h2 className="text-3xl font-bold text-center mb-10 tracking-tight text-gray-900 dark:text-white">Loved by data people</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white p-6">
                <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
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
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white">Ready to make your data beautiful?</h2>
          <p className="text-gray-500 mb-8">Free while in beta. No account required.</p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity gap-2 px-8 rounded-full shadow-lg shadow-orange-500/20 dark:shadow-orange-500/10"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Upload your CSV<ArrowRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex -space-x-2">
              {["bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-pink-400"].map((bg, i) => (
                <div key={i} className={`h-6 w-6 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}>
                  {["A", "B", "C", "D", "E"][i]}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
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
              <a href="/templates" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Templates</a>
              <a href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Pricing</a>
              <a href="/my" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">My Dashboards</a>
            </div>
            <p>Built with ☕ and AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
