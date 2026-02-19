import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
            <FileSpreadsheet className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">404</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
          This dashboard doesn&apos;t exist or has expired.
        </p>
        <Link href="/">
          <Button className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 rounded-full px-6">
            Create a dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
