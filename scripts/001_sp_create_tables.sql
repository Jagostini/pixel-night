-- ============================================
-- Soirees Pixels - Tables (prefixed sp_)
-- ============================================

-- Profils organisateurs
CREATE TABLE IF NOT EXISTS public.sp_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'organizer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Themes (liste blanche)
CREATE TABLE IF NOT EXISTS public.sp_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  excluded_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Soirees
CREATE TABLE IF NOT EXISTS public.sp_soirees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL DEFAULT 'theme_vote'
    CHECK (phase IN ('theme_vote', 'film_vote', 'completed', 'planned')),
  event_date DATE,
  theme_count INT NOT NULL DEFAULT 4,
  film_count INT NOT NULL DEFAULT 10,
  vote_duration_minutes INT,
  theme_vote_ends_at TIMESTAMPTZ,
  film_vote_ends_at TIMESTAMPTZ,
  winning_theme_id UUID REFERENCES public.sp_themes(id),
  winning_film_tmdb_id INT,
  winning_film_title TEXT,
  winning_film_poster TEXT,
  exclusion_soirees INT NOT NULL DEFAULT 5,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Themes proposes pour une soiree
CREATE TABLE IF NOT EXISTS public.sp_soiree_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soiree_id UUID NOT NULL REFERENCES public.sp_soirees(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.sp_themes(id),
  vote_count INT NOT NULL DEFAULT 0,
  UNIQUE(soiree_id, theme_id)
);

-- Films proposes pour une soiree
CREATE TABLE IF NOT EXISTS public.sp_soiree_films (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soiree_id UUID NOT NULL REFERENCES public.sp_soirees(id) ON DELETE CASCADE,
  tmdb_id INT NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  overview TEXT,
  release_date TEXT,
  director TEXT,
  duration INT,
  trailer_url TEXT,
  vote_count INT NOT NULL DEFAULT 0,
  UNIQUE(soiree_id, tmdb_id)
);

-- Votes themes (participants anonymes)
CREATE TABLE IF NOT EXISTS public.sp_theme_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soiree_id UUID NOT NULL REFERENCES public.sp_soirees(id) ON DELETE CASCADE,
  soiree_theme_id UUID NOT NULL REFERENCES public.sp_soiree_themes(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(soiree_id, voter_id)
);

-- Votes films (participants anonymes)
CREATE TABLE IF NOT EXISTS public.sp_film_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soiree_id UUID NOT NULL REFERENCES public.sp_soirees(id) ON DELETE CASCADE,
  soiree_film_id UUID NOT NULL REFERENCES public.sp_soiree_films(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(soiree_id, voter_id)
);
