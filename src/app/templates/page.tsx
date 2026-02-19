"use client";

import { useState } from "react";
import { FileSpreadsheet, BarChart3, Users, DollarSign, ListChecks, MessageSquare, ShoppingCart, Megaphone, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";

const templates = [
  {
    name: "Sales Pipeline",
    file: "sales-pipeline.csv",
    icon: BarChart3,
    description: "Track deals across stages, reps, and industries. Perfect for sales managers.",
    tags: ["Sales", "CRM", "Pipeline"],
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Org Chart",
    file: "org-chart.csv",
    icon: Users,
    description: "Visualize team hierarchy with interactive org chart. Supports departments and roles.",
    tags: ["HR", "Team", "Hierarchy"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Monthly Finances",
    file: "monthly-finances.csv",
    icon: DollarSign,
    description: "Income vs expenses breakdown. Monthly trends and category analysis.",
    tags: ["Finance", "Budget", "Accounting"],
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Project Tracker",
    file: "project-tracker.csv",
    icon: ListChecks,
    description: "Monitor project progress, deadlines, and team assignments at a glance.",
    tags: ["Projects", "Tasks", "Management"],
    color: "from-purple-500 to-violet-500",
  },
  {
    name: "Customer Feedback",
    file: "customer-feedback.csv",
    icon: MessageSquare,
    description: "Analyze NPS scores, sentiment, and feedback themes. Find what customers love.",
    tags: ["Support", "NPS", "Feedback"],
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "Shopify Orders",
    file: "shopify-orders.csv",
    icon: ShoppingCart,
    description: "E-commerce order dashboard. Revenue by channel, product performance, fulfillment status.",
    tags: ["E-commerce", "Shopify", "Orders"],
    color: "from-teal-500 to-green-500",
  },
  {
    name: "Marketing Campaigns",
    file: "marketing-campaigns.csv",
    icon: Megaphone,
    description: "Campaign ROI, spend vs revenue, channel performance. Know what's working.",
    tags: ["Marketing", "Ads", "ROI"],
    color: "from-red-500 to-orange-500",
  },
  {
    name: "Student Grades",
    file: "student-grades.csv",
    icon: GraduationCap,
    description: "Class performance overview. Identify at-risk students and honor roll candidates.",
    tags: ["Education", "Grades", "Students"],
    color: "from-indigo-500 to-blue-500",
  },
];

export default function Templates() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUseTemplate = async (file: string) => {
    setLoading(file);
    // Navigate to home with template param
    window.location.href = `/?template=${file}`;
  };

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
            <a href="/pricing" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
            Dashboard Templates
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Start with a template, then upload your own data. Each template is designed for a specific use case.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.file}
              className="group border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-500/20 transition-all"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-4`}>
                <t.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {t.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-rose-500 group-hover:text-white group-hover:border-transparent transition-all"
                onClick={() => handleUseTemplate(t.file)}
                disabled={loading === t.file}
              >
                {loading === t.file ? "Loading..." : "Use Template"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 dark:text-gray-500 mb-4">Don&apos;t see what you need?</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 rounded-full px-6">
              Upload your own CSV
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
