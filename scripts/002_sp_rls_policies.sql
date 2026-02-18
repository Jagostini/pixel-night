-- ============================================
-- Soirees Pixels - Row Level Security Policies
-- ============================================

-- ---- sp_profiles ----
ALTER TABLE public.sp_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_profiles_select_own" ON public.sp_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "sp_profiles_insert_own" ON public.sp_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "sp_profiles_update_own" ON public.sp_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ---- sp_themes ----
ALTER TABLE public.sp_themes ENABLE ROW LEVEL SECURITY;

-- Anyone can read themes
CREATE POLICY "sp_themes_select_public" ON public.sp_themes
  FOR SELECT USING (true);

-- Only authenticated users (organizers) can insert/update/delete
CREATE POLICY "sp_themes_insert_auth" ON public.sp_themes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sp_themes_update_auth" ON public.sp_themes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_themes_delete_auth" ON public.sp_themes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- sp_soirees ----
ALTER TABLE public.sp_soirees ENABLE ROW LEVEL SECURITY;

-- Anyone can read soirees
CREATE POLICY "sp_soirees_select_public" ON public.sp_soirees
  FOR SELECT USING (true);

-- Only authenticated users can create/update soirees
CREATE POLICY "sp_soirees_insert_auth" ON public.sp_soirees
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sp_soirees_update_auth" ON public.sp_soirees
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_soirees_delete_auth" ON public.sp_soirees
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- sp_soiree_themes ----
ALTER TABLE public.sp_soiree_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_soiree_themes_select_public" ON public.sp_soiree_themes
  FOR SELECT USING (true);

CREATE POLICY "sp_soiree_themes_insert_auth" ON public.sp_soiree_themes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sp_soiree_themes_update_auth" ON public.sp_soiree_themes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_soiree_themes_delete_auth" ON public.sp_soiree_themes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- sp_soiree_films ----
ALTER TABLE public.sp_soiree_films ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_soiree_films_select_public" ON public.sp_soiree_films
  FOR SELECT USING (true);

CREATE POLICY "sp_soiree_films_insert_auth" ON public.sp_soiree_films
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sp_soiree_films_update_auth" ON public.sp_soiree_films
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_soiree_films_delete_auth" ON public.sp_soiree_films
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- sp_theme_votes ----
ALTER TABLE public.sp_theme_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read vote counts
CREATE POLICY "sp_theme_votes_select_public" ON public.sp_theme_votes
  FOR SELECT USING (true);

-- Anyone (including anon) can insert a vote
CREATE POLICY "sp_theme_votes_insert_anon" ON public.sp_theme_votes
  FOR INSERT WITH CHECK (true);

-- ---- sp_film_votes ----
ALTER TABLE public.sp_film_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read vote counts
CREATE POLICY "sp_film_votes_select_public" ON public.sp_film_votes
  FOR SELECT USING (true);

-- Anyone (including anon) can insert a vote
CREATE POLICY "sp_film_votes_insert_anon" ON public.sp_film_votes
  FOR INSERT WITH CHECK (true);
