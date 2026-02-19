import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { config, data, existingSlug } = body;
    if (!config || !data) {
      return NextResponse.json({ error: "config and data are required" }, { status: 400 });
    }

    // Try to get the current authenticated user from cookies
    let userId: string | null = null;
    try {
      const supabaseServer = await getSupabaseServer();
      const { data: { user } } = await supabaseServer.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Not authenticated, continue as anonymous
    }

    const supabase = getSupabaseAdmin();

    // Update existing dashboard
    if (existingSlug) {
      const { error } = await supabase
        .from("dashboards")
        .update({
          title: config.title || "Untitled Dashboard",
          description: config.description || "",
          config,
          csv_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", existingSlug);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json({ error: "Failed to update dashboard" }, { status: 500 });
      }

      return NextResponse.json({ slug: existingSlug, url: `/d/${existingSlug}` });
    }

    // Create new dashboard
    const slug = generateSlug();

    const { error } = await supabase.from("dashboards").insert({
      slug,
      title: config.title || "Untitled Dashboard",
      description: config.description || "",
      config,
      csv_data: data,
      is_public: true,
      user_id: userId,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save dashboard" }, { status: 500 });
    }

    return NextResponse.json({ slug, url: `/d/${slug}` });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed" },
      { status: 500 }
    );
  }
}
