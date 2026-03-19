import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Pixel Night, conformément à la loi française.",
}

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Mentions légales</h1>
      <p className="mb-12 text-sm text-muted-foreground">
        Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
        numérique (LCEN).
      </p>

      <div className="space-y-10">
        {/* Éditeur */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Éditeur du site</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Helixir</span>
            </p>
            <p>France</p>
            <p>
              Email :{" "}
              <a
                href="mailto:contact@helixir.dev"
                className="text-foreground underline underline-offset-4 hover:no-underline"
              >
                contact@helixir.dev
              </a>
            </p>
            <p>
              Site :{" "}
              <a
                href="https://helixir.dev/en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:no-underline"
              >
                helixir.dev
              </a>
            </p>
          </div>
        </section>

        {/* Hébergement */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Hébergement</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Application — Vercel Inc.</p>
              <p>340 Pine Street, Suite 603, San Francisco, CA 94104, États-Unis</p>
              <p>
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  vercel.com
                </a>
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Base de données — Supabase Inc.</p>
              <p>970 Toa Payoh North, Singapour (infrastructure AWS EU)</p>
              <p>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  supabase.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Propriété intellectuelle */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Propriété intellectuelle</h2>
          <p className="text-sm text-muted-foreground">
            Pixel Night est un logiciel open source publié sous licence{" "}
            <a
              href="https://github.com/Jagostini/pixel-night/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              MIT + Commons Clause
            </a>
            . Le code source est librement consultable sur GitHub. Toute reproduction ou
            utilisation commerciale sans accord préalable est interdite conformément à la
            Commons Clause.
          </p>
        </section>

        {/* Responsabilité */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Limitation de responsabilité</h2>
          <p className="text-sm text-muted-foreground">
            Helixir s&apos;efforce de maintenir les informations de ce site à jour et exactes.
            Toutefois, la disponibilité du service n&apos;est pas garantie. Les données de films
            sont fournies par The Movie Database (TMDb) — Helixir ne saurait être tenu responsable
            de leur exactitude ou de leur exhaustivité.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Contact</h2>
          <p className="text-sm text-muted-foreground">
            Pour toute question relative à ce site :{" "}
            <a
              href="mailto:contact@helixir.dev"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              contact@helixir.dev
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
