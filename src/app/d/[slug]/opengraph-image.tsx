import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "CSVApp Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: dashboard } = await supabase
    .from("dashboards")
    .select("title, config")
    .eq("slug", slug)
    .single();

  const title = dashboard?.title || "Dashboard";
  const kpis = dashboard?.config?.kpiCards?.slice(0, 4) || [];
  const chartCount = dashboard?.config?.charts?.length || 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #fff5f0 0%, #ffffff 50%, #fef3f0 100%)",
          padding: "60px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f97316, #e11d48)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            📊
          </div>
          <span style={{ fontSize: "24px", color: "#9ca3af" }}>CSVApp</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "56px",
            fontWeight: "800",
            color: "#111827",
            margin: "0 0 40px 0",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>

        {/* KPI Cards */}
        {kpis.length > 0 && (
          <div style={{ display: "flex", gap: "20px", marginBottom: "auto" }}>
            {kpis.map((kpi: any, i: number) => (
              <div
                key={i}
                style={{
                  background: "white",
                  border: "1px solid #f3f4f6",
                  borderRadius: "16px",
                  padding: "24px 32px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {kpi.label}
                </span>
                <span style={{ fontSize: "32px", fontWeight: "700", color: "#111827", marginTop: "4px" }}>
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "40px" }}>
          <span style={{ fontSize: "18px", color: "#9ca3af" }}>
            {chartCount} chart{chartCount !== 1 ? "s" : ""} • Interactive dashboard
          </span>
          <span style={{ fontSize: "18px", color: "#f97316", fontWeight: "600" }}>csvapp.vercel.app</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
