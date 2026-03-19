import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Film, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Crédits",
  description: "Attributions et remerciements pour les services utilisés par Pixel Night.",
}

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Crédits</h1>
      <p className="mb-12 text-muted-foreground">
        Pixel Night repose sur des services tiers sans lesquels l&apos;application ne pourrait pas
        fonctionner.
      </p>

      {/* TMDb */}
      <section className="rounded-xl border border-border p-6">
        <div className="mb-4 flex items-center gap-3">
          <Image
            src="/tmdb-logo.svg"
            alt="The Movie Database (TMDB)"
            width={160}
            height={12}
            className="h-auto"
          />
        </div>

        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Les données de films (titres, affiches, synopsis, notes, bandes-annonces) sont fournies
          par{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-foreground underline underline-offset-4 hover:no-underline"
          >
            The Movie Database (TMDB)
            <ExternalLink className="h-3 w-3" />
          </a>
          .
        </p>

        <blockquote className="rounded-lg border-l-4 border-[#01b4e4] bg-muted/40 px-4 py-3 text-sm italic text-muted-foreground">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </blockquote>
      </section>

      {/* Pixel Night */}
      <section className="mt-8 rounded-xl border border-border p-6">
        <div className="mb-4 flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Pixel Night</h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pixel Night est un projet open source publié sous licence MIT + Commons Clause.{" "}
          <Link
            href="https://github.com/Jagostini/pixel-night"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-foreground underline underline-offset-4 hover:no-underline"
          >
            Voir le code source
            <ExternalLink className="h-3 w-3" />
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
