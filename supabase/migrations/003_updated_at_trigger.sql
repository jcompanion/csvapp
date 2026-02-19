-- Auto-update updated_at on dashboards
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dashboards_updated_at ON dashboards;
CREATE TRIGGER dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure updated_at column exists (defensive)
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
