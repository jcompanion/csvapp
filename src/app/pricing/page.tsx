"use client";

import { FileSpreadsheet, Check, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying it out",
    features: [
      "3 dashboards",
      "Up to 1,000 rows per CSV",
      "AI-powered charts & insights",
      "Shareable links (expire in 7 days)",
      "CSVApp watermark",
      "Community support",
    ],
    cta: "Get started free",
    popular: false,
    href: "/",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For consultants & power users",
    features: [
      "Unlimited dashboards",
      "Up to 50,000 rows per CSV",
      "AI-powered charts & insights",
      "Permanent shareable links",
      "Custom link slugs",
      "Google Sheets import",
      "No watermark",
      "Embeddable iframes",
      "Export to PDF",
      "Priority support",
    ],
    cta: "Start free trial",
    popular: true,
    href: "#",
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For teams & agencies",
    features: [
      "Everything in Pro",
      "Up to 500,000 rows per CSV",
      "3 team members included",
      "Dashboard collaboration",
      "Custom branding (white-label)",
      "API access",
      "Embed dashboards anywhere",
      "Dedicated support",
    ],
    cta: "Start free trial",
    popular: false,
    href: "#",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
          <Link href="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg text-gray-900 dark:text-white">CSVApp</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4" style={{ letterSpacing: "-0.5px" }}>
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.popular
                    ? "border-orange-300 dark:border-orange-500/40 bg-orange-50/30 dark:bg-orange-950/20 shadow-lg shadow-orange-500/10"
                    : "border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-white" />
                      Most popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? "text-orange-500" : "text-green-500"}`} />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-full font-medium ${
                    plan.popular
                      ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What happens when I hit the free plan limit?",
                a: "You can still view your existing dashboards, but you'll need to upgrade to create new ones. We'll never delete your data.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes! Cancel with one click. You'll keep access until the end of your billing period.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. Your CSV data is stored in encrypted Supabase databases. We never share or sell your data. You can delete it anytime.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, within 14 days of purchase if you're not satisfied.",
              },
              {
                q: "Can I use this for my team?",
                a: "The Team plan supports up to 5 members with collaboration features. Need more? Contact us for custom plans.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-gray-100 dark:border-white/5 pb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/5 py-8 px-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <FileSpreadsheet className="h-3 w-3 text-white" />
            </div>
            <span>CSVApp</span>
          </div>
          <p>Built with ☕ and AI</p>
        </div>
      </footer>
    </div>
  );
}
