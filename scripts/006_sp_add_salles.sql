-- 1. Nouvelle table sp_salles
CREATE TABLE sp_salles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sp_salles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read salles" ON sp_salles FOR SELECT USING (true);
CREATE POLICY "Owner manages salle" ON sp_salles FOR ALL USING (auth.uid() = created_by);

-- 2. Ajouter salle_id aux tables existantes (nullable pour retrocompatibilite)
ALTER TABLE sp_soirees ADD COLUMN salle_id UUID REFERENCES sp_salles(id) ON DELETE CASCADE;
ALTER TABLE sp_themes ADD COLUMN salle_id UUID REFERENCES sp_salles(id) ON DELETE CASCADE;

-- 3. Index pour les performances
CREATE INDEX idx_soirees_salle_id ON sp_soirees(salle_id);
CREATE INDEX idx_themes_salle_id ON sp_themes(salle_id);
