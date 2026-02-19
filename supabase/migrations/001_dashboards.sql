-- Dashboards table for shareable CSV dashboards
CREATE TABLE IF NOT EXISTS dashboards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  csv_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_dashboards_slug ON dashboards(slug);
CREATE INDEX IF NOT EXISTS idx_dashboards_public ON dashboards(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

-- Public can view public dashboards
CREATE POLICY "Public dashboards are viewable by everyone"
  ON dashboards FOR SELECT
  USING (is_public = true);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role has full access"
  ON dashboards FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_views(dashboard_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE dashboards SET views = views + 1 WHERE slug = dashboard_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
