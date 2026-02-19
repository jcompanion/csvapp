"use client";

import { DashboardView } from "@/components/dashboard-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileSpreadsheet, Eye, Clock, ArrowLeft, Code, Copy, CheckCircle2, Pencil, Save, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SharedDashboardProps {
  config: any;
  data: any;
  title: string;
  views: number;
  createdAt: string;
  slug: string;
  userId?: string | null;
}

export function SharedDashboard({ config: initialConfig, data, title, views, createdAt, slug, userId }: SharedDashboardProps) {
  const timeAgo = getTimeAgo(new Date(createdAt));
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localConfig, setLocalConfig] = useState(initialConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${slug}" width="100%" height="600" frameborder="0" style="border-radius: 12px; border: 1px solid #e5e7eb;"></iframe>`;

  // Check if current user is the dashboard owner
  useEffect(() => {
    if (!userId) return;
    supabase.auth.getUser().then(({ data: userData }) => {
      if (userData.user?.id === userId) setIsOwner(true);
    });
  }, [userId]);

  const handleConfigChange = useCallback((newConfig: any) => {
    setLocalConfig(newConfig);
    setIsDirty(true);
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("dashboards")
        .update({ config: localConfig, updated_at: new Date().toISOString() })
        .eq("slug", slug);
      if (!error) {
        setIsDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [localConfig, slug]);

  // Warn on unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg text-gray-900 dark:text-white">CSVApp</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Views + time — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {views} views
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowEmbed(!showEmbed)}
            >
              <Code className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Embed</span>
            </Button>
            {isOwner && (
              <>
                <Button
                  variant={isEditMode ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs gap-1.5 ${isEditMode ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isEditMode ? "Done" : "Edit"}</span>
                </Button>
                {isDirty && (
                  <Button
                    size="sm"
                    className="text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                    ) : saved ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">{saving ? "Saving..." : saved ? "Saved!" : "Save"}</span>
                  </Button>
                )}
              </>
            )}
            <ThemeToggle />
            <Link href="/">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity rounded-full px-3 sm:px-4 text-xs"
              >
                Create yours
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {showEmbed && (
        <div className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-900 px-4 py-3">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Embed this dashboard</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                  setEmbedCopied(true);
                  setTimeout(() => setEmbedCopied(false), 2000);
                }}
              >
                {embedCopied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {embedCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg p-3 overflow-x-auto text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">
              {embedCode}
            </pre>
          </div>
        </div>
      )}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <DashboardView
          config={localConfig}
          data={data}
          isEditMode={isEditMode}
          onConfigChange={isOwner ? handleConfigChange : undefined}
        />
      </main>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
