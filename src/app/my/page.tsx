"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet, Eye, Clock, Trash2, ExternalLink, Plus, LogIn,
  LayoutGrid, List, Share2, CheckCircle2, Copy, Search,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

interface Dashboard {
  slug: string;
  title: string;
  description?: string;
  views: number;
  created_at: string;
  updated_at?: string;
  is_public: boolean;
}

function DashboardGridCard({
  d,
  onDelete,
  onShare,
  copiedSlug,
}: {
  d: Dashboard;
  onDelete: (slug: string) => void;
  onShare: (slug: string) => void;
  copiedSlug: string | null;
}) {
  return (
    <div className="group border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-500/20 transition-all bg-white dark:bg-gray-900/40">
      {/* Icon & delete */}
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-950/40 dark:to-rose-950/40 flex items-center justify-center">
          <FileSpreadsheet className="h-5 w-5 text-orange-500" />
        </div>
        <button
          onClick={() => onDelete(d.slug)}
          className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Title & description */}
      <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">{d.title || "Untitled"}</h3>
      {d.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{d.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {d.views}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {d.updated_at ? timeAgo(d.updated_at) : timeAgo(d.created_at)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
        <Link href={`/d/${d.slug}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
            <ExternalLink className="h-3 w-3" />
            Open
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs gap-1.5 h-8"
          onClick={() => onShare(d.slug)}
        >
          {copiedSlug === d.slug ? (
            <><CheckCircle2 className="h-3 w-3 text-green-500" />Copied!</>
          ) : (
            <><Share2 className="h-3 w-3" />Share</>
          )}
        </Button>
      </div>
    </div>
  );
}

function DashboardListCard({
  d,
  onDelete,
  onShare,
  copiedSlug,
}: {
  d: Dashboard;
  onDelete: (slug: string) => void;
  onShare: (slug: string) => void;
  copiedSlug: string | null;
}) {
  return (
    <div className="group flex items-center gap-4 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/20 transition-all bg-white dark:bg-gray-900/40">
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-950/40 dark:to-rose-950/40 flex items-center justify-center shrink-0">
        <FileSpreadsheet className="h-4 w-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{d.title || "Untitled"}</p>
        {d.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{d.description}</p>}
      </div>
      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 shrink-0">
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {d.views}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {d.updated_at ? timeAgo(d.updated_at) : timeAgo(d.created_at)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onShare(d.slug)}
        >
          {copiedSlug === d.slug ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
        <Link href={`/d/${d.slug}`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
            <ExternalLink className="h-3 w-3" />Open
          </Button>
        </Link>
        <button
          onClick={() => onDelete(d.slug)}
          className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function MyDashboards() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadDashboards(data.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadDashboards(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDashboards = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("dashboards")
      .select("slug, title, description, views, created_at, updated_at, is_public")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setDashboards(data || []);
    setLoading(false);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this dashboard? This cannot be undone.")) return;
    await supabase.from("dashboards").delete().eq("slug", slug);
    setDashboards((prev) => prev.filter((d) => d.slug !== slug));
  };

  const handleShare = async (slug: string) => {
    const url = `${window.location.origin}/d/${slug}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredDashboards = dashboards.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.title || "").toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
          <Link href="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg text-gray-900 dark:text-white">CSVApp</span>
          </Link>
          <div className="flex items-center gap-2">
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Dashboards</h1>
            {user && !loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {dashboards.length} dashboard{dashboards.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            {user && dashboards.length > 0 && (
              <div className="flex border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}
            <Link href="/">
              <Button className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 rounded-full gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search (only when has dashboards) */}
        {user && dashboards.length > 3 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search dashboards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
        )}

        {/* States */}
        {!user ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <LogIn className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sign in to see your dashboards</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Save and manage all your dashboards in one place.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filteredDashboards.length === 0 ? (
          dashboards.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No dashboards yet</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Upload a CSV to create your first dashboard.</p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 rounded-full">
                  Create Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No dashboards match &ldquo;{search}&rdquo;
            </div>
          )
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDashboards.map((d) => (
              <DashboardGridCard
                key={d.slug}
                d={d}
                onDelete={handleDelete}
                onShare={handleShare}
                copiedSlug={copiedSlug}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredDashboards.map((d) => (
              <DashboardListCard
                key={d.slug}
                d={d}
                onDelete={handleDelete}
                onShare={handleShare}
                copiedSlug={copiedSlug}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
