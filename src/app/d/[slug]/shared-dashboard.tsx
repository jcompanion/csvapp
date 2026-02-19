"use client";

import { DashboardView } from "@/components/dashboard-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileSpreadsheet, Eye, Clock, ArrowLeft, Code, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SharedDashboardProps {
  config: any;
  data: any;
  title: string;
  views: number;
  createdAt: string;
}

export function SharedDashboard({ config, data, title, views, createdAt }: SharedDashboardProps) {
  const timeAgo = getTimeAgo(new Date(createdAt));
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const slug = typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "";
  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${slug}" width="100%" height="600" frameborder="0" style="border-radius: 12px; border: 1px solid #e5e7eb;"></iframe>`;

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
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
              Embed
            </Button>
            <ThemeToggle />
            <Link href="/">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity rounded-full px-4"
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
            <pre className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg p-3 overflow-x-auto text-gray-600 dark:text-gray-400">
              {embedCode}
            </pre>
          </div>
        </div>
      )}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <DashboardView config={config} data={data} />
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
