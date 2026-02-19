"use client";

import { DashboardView } from "@/components/dashboard-view";
import { FileSpreadsheet } from "lucide-react";
import Link from "next/link";

interface EmbedDashboardProps {
  config: any;
  data: any;
}

export function EmbedDashboard({ config, data }: EmbedDashboardProps) {
  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <DashboardView config={config} data={data} />
      {/* Powered by badge */}
      <div className="mt-6 flex justify-center">
        <Link
          href="https://csvapp.vercel.app"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <div className="h-4 w-4 rounded bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
            <FileSpreadsheet className="h-2.5 w-2.5 text-white" />
          </div>
          Powered by CSVApp
        </Link>
      </div>
    </div>
  );
}
