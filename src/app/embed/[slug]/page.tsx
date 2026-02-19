import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { EmbedDashboard } from "./embed-dashboard";

async function getDashboard(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
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
  return { title: `${dashboard.title} — CSVApp` };
}

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dashboard = await getDashboard(slug);

  if (!dashboard) {
    notFound();
  }

  return <EmbedDashboard config={dashboard.config} data={dashboard.csv_data} />;
}
