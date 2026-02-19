"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Eye, Clock, Trash2, ExternalLink, Plus, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MyDashboards() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDashboards = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("dashboards")
      .select("slug, title, views, created_at, is_public")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setDashboards(data || []);
    setLoading(false);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this dashboard?")) return;
    await supabase.from("dashboards").delete().eq("slug", slug);
    setDashboards((prev) => prev.filter((d) => d.slug !== slug));
  };

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboards</h1>
          <Link href="/">
            <Button className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 rounded-full gap-2">
              <Plus className="h-4 w-4" />
              New Dashboard
            </Button>
          </Link>
        </div>

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
        ) : dashboards.length === 0 ? (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((d) => (
              <div
                key={d.slug}
                className="group border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-500/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                    {d.title || "Untitled"}
                  </h3>
                  <button
                    onClick={() => handleDelete(d.slug)}
                    className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {d.views}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(d.created_at)}</span>
                </div>
                <Link
                  href={`/d/${d.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
