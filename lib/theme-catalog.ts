export interface CatalogTheme {
  name: string
  genre_ids: number[]
  keywords: string[]
}

/** Identifiants de genres TMDb avec leurs libellés en français */
export const TMDB_GENRES: Record<number, string> = {
  28:    "Action",
  12:    "Aventure",
  16:    "Animation",
  35:    "Comédie",
  80:    "Crime",
  99:    "Documentaire",
  18:    "Drame",
  10751: "Famille",
  14:    "Fantastique",
  36:    "Histoire",
  27:    "Horreur",
  10402: "Musique",
  9648:  "Mystère",
  10749: "Romance",
  878:   "Science-Fiction",
  53:    "Thriller",
  10752: "Guerre",
  37:    "Western",
}

/** Liste ordonnée pour les sélecteurs de genres */
export const TMDB_GENRE_LIST = Object.entries(TMDB_GENRES)
  .map(([id, label]) => ({ id: Number(id), label }))
  .sort((a, b) => a.label.localeCompare(b.label, "fr"))

/** Catalogue de thèmes pré-définis importables en un clic */
export const THEME_CATALOG: CatalogTheme[] = [
  { name: "Action & Aventure",          genre_ids: [28, 12],         keywords: ["action", "aventure"] },
  { name: "Animation",                  genre_ids: [16],             keywords: ["animation"] },
  { name: "Cinéma des années 80",       genre_ids: [28, 35, 878],    keywords: ["années 80", "eighties"] },
  { name: "Cinéma des années 90",       genre_ids: [28, 35, 18],     keywords: ["années 90", "nineties"] },
  { name: "Comédie",                    genre_ids: [35],             keywords: ["comédie", "humour"] },
  { name: "Comédie noire",              genre_ids: [35, 80],         keywords: ["comédie noire"] },
  { name: "Comédie romantique",         genre_ids: [35, 10749],      keywords: ["comédie romantique"] },
  { name: "Documentaire",               genre_ids: [99],             keywords: ["documentaire"] },
  { name: "Drame",                      genre_ids: [18],             keywords: ["drame"] },
  { name: "Dystopie & Post-apo",        genre_ids: [878, 18],        keywords: ["dystopie", "post-apocalyptique"] },
  { name: "Espionnage",                 genre_ids: [28, 53],         keywords: ["espion", "espionnage", "spy"] },
  { name: "Famille & Jeunesse",         genre_ids: [10751, 16],      keywords: ["famille", "enfants"] },
  { name: "Fantasy",                    genre_ids: [14],             keywords: ["fantastique", "fantasy", "magie"] },
  { name: "Films cultes",               genre_ids: [18, 80, 53],     keywords: ["culte", "classique"] },
  { name: "Films de monstres",          genre_ids: [27, 878],        keywords: ["monstre", "créature"] },
  { name: "Films de sport",             genre_ids: [28, 18],         keywords: ["sport", "compétition"] },
  { name: "Films de superhéros",        genre_ids: [28, 12],         keywords: ["superhéros", "marvel"] },
  { name: "Films de vampires / zombies",genre_ids: [27],             keywords: ["vampire", "zombie"] },
  { name: "Films historiques",          genre_ids: [36, 18],         keywords: ["historique", "époque"] },
  { name: "Films noirs",                genre_ids: [80, 53],         keywords: ["film noir", "détective", "crime"] },
  { name: "Guerre",                     genre_ids: [10752],          keywords: ["guerre", "conflit"] },
  { name: "Horreur",                    genre_ids: [27],             keywords: ["horreur", "épouvante"] },
  { name: "Musique & Biopic",           genre_ids: [10402, 18],      keywords: ["musique", "biopic"] },
  { name: "Mystère & Enquête",          genre_ids: [9648, 80],       keywords: ["mystère", "enquête"] },
  { name: "Policier",                   genre_ids: [80, 9648],       keywords: ["policier", "détective"] },
  { name: "Road Movie",                 genre_ids: [18, 12],         keywords: ["road movie", "voyage"] },
  { name: "Romance",                    genre_ids: [10749],          keywords: ["romance", "amour"] },
  { name: "Science-Fiction",            genre_ids: [878],            keywords: ["science-fiction", "futur", "espace"] },
  { name: "Thriller psychologique",     genre_ids: [53, 9648],       keywords: ["thriller", "suspense"] },
  { name: "Western",                    genre_ids: [37],             keywords: ["western", "cowboy"] },
]
