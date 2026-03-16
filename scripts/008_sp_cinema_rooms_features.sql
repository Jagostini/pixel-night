-- Migration 008 : Gestion des salles de cinéma, règles d'exclusion,
-- genres TMDb pour la découverte automatique.
-- Exécuter dans l'éditeur SQL Supabase.

-- ============================================================
-- 1. Règles d'exclusion des thèmes au niveau cinéma (sp_salles)
-- ============================================================
ALTER TABLE sp_salles
  ADD COLUMN IF NOT EXISTS exclusion_mode  TEXT    NOT NULL DEFAULT 'soirees'
    CHECK (exclusion_mode IN ('none', 'days', 'soirees')),
  ADD COLUMN IF NOT EXISTS exclusion_value INTEGER NOT NULL DEFAULT 5;

-- ============================================================
-- 2. Table sp_salle_rooms — salles individuelles dans un cinéma
-- ============================================================
CREATE TABLE IF NOT EXISTS sp_salle_rooms (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  salle_id    UUID        NOT NULL REFERENCES sp_salles(id) ON DELETE CASCADE,
  name        TEXT,                        -- nom optionnel (ex: "Grande Salle", "Salle 2")
  capacity    INTEGER,                     -- capacité max (optionnel)
  room_order  INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sp_salle_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rooms" ON sp_salle_rooms
  FOR SELECT USING (true);

CREATE POLICY "Owner manages rooms" ON sp_salle_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sp_salles
      WHERE sp_salles.id = sp_salle_rooms.salle_id
        AND sp_salles.created_by = auth.uid()
    )
  );

-- ============================================================
-- 3. Salle par défaut pour chaque cinéma existant
-- ============================================================
INSERT INTO sp_salle_rooms (salle_id, name, room_order)
SELECT id, NULL, 1
FROM   sp_salles
WHERE  NOT EXISTS (
  SELECT 1 FROM sp_salle_rooms WHERE salle_id = sp_salles.id
);

-- ============================================================
-- 4. Ajouter room_id sur sp_soirees
-- ============================================================
ALTER TABLE sp_soirees
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES sp_salle_rooms(id) ON DELETE SET NULL;

-- Migrer les soirées existantes vers la salle par défaut de leur cinéma
UPDATE sp_soirees s
SET    room_id = (
  SELECT r.id
  FROM   sp_salle_rooms r
  WHERE  r.salle_id = s.salle_id
  ORDER BY r.room_order ASC
  LIMIT  1
)
WHERE  s.salle_id IS NOT NULL
  AND  s.room_id  IS NULL;

-- ============================================================
-- 5. Genres TMDb sur sp_themes (moteur de découverte)
-- ============================================================
ALTER TABLE sp_themes
  ADD COLUMN IF NOT EXISTS genre_ids INTEGER[] DEFAULT '{}';

-- ============================================================
-- 6. Index
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_salle_rooms_salle_id ON sp_salle_rooms(salle_id);
CREATE INDEX IF NOT EXISTS idx_soirees_room_id      ON sp_soirees(room_id);

-- ============================================================
-- 7. Grants
-- ============================================================
GRANT SELECT                         ON public.sp_salle_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sp_salle_rooms TO authenticated;
GRANT ALL                            ON public.sp_salle_rooms TO service_role;
