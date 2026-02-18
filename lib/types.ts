// ---- Database row types (matching sp_ tables) ----

export type SoireePhase = "theme_vote" | "film_vote" | "completed" | "planned";

export interface SpProfile {
  id: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

export interface SpTheme {
  id: string;
  name: string;
  keywords: string[];
  is_active: boolean;
  excluded_until: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SpSoiree {
  id: string;
  phase: SoireePhase;
  event_date: string | null;
  theme_count: number;
  film_count: number;
  vote_duration_minutes: number | null;
  theme_vote_ends_at: string | null;
  film_vote_ends_at: string | null;
  winning_theme_id: string | null;
  winning_film_tmdb_id: number | null;
  winning_film_title: string | null;
  winning_film_poster: string | null;
  exclusion_soirees: number;
  created_by: string | null;
  created_at: string;
}

export interface SpSoireeTheme {
  id: string;
  soiree_id: string;
  theme_id: string;
  vote_count: number;
  // joined
  theme?: SpTheme;
}

export interface SpSoireeFilm {
  id: string;
  soiree_id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  overview: string | null;
  release_date: string | null;
  director: string | null;
  duration: number | null;
  trailer_url: string | null;
  vote_count: number;
}

export interface SpThemeVote {
  id: string;
  soiree_id: string;
  soiree_theme_id: string;
  voter_id: string;
  created_at: string;
}

export interface SpFilmVote {
  id: string;
  soiree_id: string;
  soiree_film_id: string;
  voter_id: string;
  created_at: string;
}

// ---- TMDb API response types ----

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TmdbMovieDetail extends TmdbMovie {
  runtime: number;
  credits?: {
    crew: Array<{ job: string; name: string }>;
  };
  videos?: {
    results: Array<{ type: string; site: string; key: string }>;
  };
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

// ---- Soiree with joined data (for display) ----

export interface SoireeWithDetails extends SpSoiree {
  themes: (SpSoireeTheme & { theme: SpTheme })[];
  films: SpSoireeFilm[];
  winning_theme?: SpTheme;
}
