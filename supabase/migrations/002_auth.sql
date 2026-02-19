-- Add user_id to dashboards for ownership
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS: anyone can read public dashboards, owners can manage theirs
DROP POLICY IF EXISTS "Dashboards are publicly viewable" ON dashboards;
CREATE POLICY "Anyone can read public dashboards" ON dashboards
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can read their own dashboards" ON dashboards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboards" ON dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own dashboards" ON dashboards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards" ON dashboards
  FOR DELETE USING (auth.uid() = user_id);
