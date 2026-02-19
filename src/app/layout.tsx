import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSVApp — Your Spreadsheet, Made Beautiful",
  description:
    "Upload a CSV, get a live interactive dashboard in 30 seconds. AI-powered charts, tables, org charts, and insights. No setup required.",
  keywords: [
    "CSV dashboard", "CSV to chart", "spreadsheet dashboard", "data visualization",
    "CSV viewer", "Google Sheets dashboard", "shareable dashboard", "AI dashboard",
    "CSV upload", "interactive charts", "org chart generator", "sales dashboard",
  ],
  openGraph: {
    title: "CSVApp — Your Spreadsheet, Made Beautiful",
    description:
      "Upload a CSV, get a live interactive dashboard in 30 seconds. No setup. No account.",
    type: "website",
    siteName: "CSVApp",
    url: "https://csvapp.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "CSVApp — Your Spreadsheet, Made Beautiful",
    description:
      "Upload a CSV, get a live interactive dashboard in 30 seconds.",
  },
  metadataBase: new URL("https://csvapp.vercel.app"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "CSVApp",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
                { "@type": "Offer", price: "19", priceCurrency: "USD", name: "Pro" },
                { "@type": "Offer", price: "49", priceCurrency: "USD", name: "Team" },
              ],
              description: "Upload a CSV, get a live interactive dashboard in 30 seconds. AI-powered charts, tables, and insights.",
              url: "https://csvapp.vercel.app",
              aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "127" },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
