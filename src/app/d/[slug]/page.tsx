import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { SharedDashboard } from "./shared-dashboard";

async function getDashboard(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  // Increment views
  await supabase.rpc("increment_views", { dashboard_slug: slug });

  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dashboard = await getDashboard(slug);
  if (!dashboard) return { title: "Dashboard not found" };

  return {
    title: `${dashboard.title} — CSVApp`,
    description: dashboard.description,
    openGraph: {
      title: `${dashboard.title} — CSVApp`,
      description: dashboard.description || "Interactive dashboard powered by CSVApp",
    },
  };
}

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dashboard = await getDashboard(slug);

  if (!dashboard) {
    notFound();
  }

  return (
    <SharedDashboard
      config={dashboard.config}
      data={dashboard.csv_data}
      title={dashboard.title}
      views={dashboard.views}
      createdAt={dashboard.created_at}
    />
  );
}
