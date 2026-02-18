import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSVApp — Your Spreadsheet, Made Beautiful",
  description:
    "Upload a CSV, get a live interactive dashboard in 30 seconds. AI-powered charts, tables, org charts, and insights. No setup required.",
  openGraph: {
    title: "CSVApp — Your Spreadsheet, Made Beautiful",
    description:
      "Upload a CSV, get a live interactive dashboard in 30 seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CSVApp — Your Spreadsheet, Made Beautiful",
    description:
      "Upload a CSV, get a live interactive dashboard in 30 seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
