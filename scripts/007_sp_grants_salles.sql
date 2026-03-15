-- Fix: grants manquants sur les tables ajoutees via migrations manuelles.
-- Les tables creees hors du setup initial Supabase n'heritent pas des grants
-- par defaut. Sans ces grants, PostgREST refuse d'inclure les tables dans son
-- schema cache (erreur "Could not find the table in the schema cache").

-- sp_salles (migration 006)
GRANT SELECT ON public.sp_salles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sp_salles TO authenticated;
GRANT ALL ON public.sp_salles TO service_role;

-- sp_soiree_film_proposals (migration 004)
GRANT SELECT ON public.sp_soiree_film_proposals TO anon;
GRANT SELECT, INSERT ON public.sp_soiree_film_proposals TO authenticated;
GRANT ALL ON public.sp_soiree_film_proposals TO service_role;
