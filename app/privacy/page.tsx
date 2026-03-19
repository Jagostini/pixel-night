import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Pixel Night — traitement des données personnelles conformément au RGPD.",
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Politique de confidentialité</h1>
      <p className="mb-12 text-sm text-muted-foreground">
        Dernière mise à jour : mars 2026 — Conformément au Règlement Général sur la Protection
        des Données (RGPD, UE 2016/679).
      </p>

      <div className="space-y-10">
        {/* Responsable */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Responsable du traitement</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">Helixir</span> — France
            </p>
            <p>
              Contact :{" "}
              <a
                href="mailto:contact@helixir.dev"
                className="text-foreground underline underline-offset-4 hover:no-underline"
              >
                contact@helixir.dev
              </a>
            </p>
          </div>
        </section>

        {/* Données collectées */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Données collectées</h2>
          <div className="space-y-6 text-sm text-muted-foreground">
            <div>
              <p className="mb-2 font-medium text-foreground">Organisateurs (compte requis)</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Adresse email et mot de passe (hashé, jamais stocké en clair)</li>
                <li>Soirées créées et leurs paramètres (thèmes, films, dates)</li>
              </ul>
              <p className="mt-2">
                Ces données sont nécessaires à l&apos;exécution du service. Elles sont traitées par
                Supabase (authentification et base de données).
              </p>
            </div>
            <div>
              <p className="mb-2 font-medium text-foreground">Participants (aucun compte)</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Un identifiant anonyme généré localement et stocké dans le{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code>{" "}
                  de votre navigateur — il n&apos;est jamais transmis à un tiers ni associé à
                  votre identité.
                </li>
              </ul>
              <p className="mt-2">
                Aucune donnée personnelle n&apos;est collectée côté serveur pour les participants.
              </p>
            </div>
          </div>
        </section>

        {/* Base légale */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Base légale du traitement</h2>
          <p className="text-sm text-muted-foreground">
            Le traitement des données des organisateurs est fondé sur l&apos;
            <span className="text-foreground font-medium">exécution d&apos;un contrat</span>{" "}
            (article 6.1.b du RGPD) — la création d&apos;un compte est nécessaire pour utiliser
            les fonctionnalités d&apos;administration.
          </p>
        </section>

        {/* Durée de conservation */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Durée de conservation</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Les données du compte (email, soirées) sont conservées tant que le compte est actif.
              Elles sont supprimées sur demande adressée à{" "}
              <a
                href="mailto:contact@helixir.dev"
                className="text-foreground underline underline-offset-4 hover:no-underline"
              >
                contact@helixir.dev
              </a>
              .
            </p>
            <p>
              L&apos;identifiant anonyme du participant est stocké localement dans votre navigateur.
              Vous pouvez le supprimer à tout moment en effaçant les données de site dans les
              paramètres de votre navigateur.
            </p>
          </div>
        </section>

        {/* Sous-traitants */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Sous-traitants et transferts</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Supabase</p>
              <p>
                Authentification et stockage des données. Infrastructure AWS en région Europe
                (eu-west-2). Politique :{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  supabase.com/privacy
                </a>
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Vercel</p>
              <p>
                Hébergement de l&apos;application. Serveurs situés aux États-Unis — transfert
                couvert par les clauses contractuelles types (CCT) de l&apos;UE. Politique :{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Vercel Web Analytics</p>
              <p>
                Mesure d&apos;audience anonymisée — sans cookie, sans stockage d&apos;adresse IP,
                sans identification des visiteurs. Aucun consentement requis.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Vercel Speed Insights</p>
              <p>
                Collecte de métriques de performance (Core Web Vitals : LCP, FID, CLS, etc.)
                à des fins d&apos;optimisation. Les données sont agrégées et anonymisées — sans
                cookie, sans identification des visiteurs. Aucun consentement requis.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">The Movie Database (TMDb)</p>
              <p>
                API utilisée pour récupérer les données de films (titres, affiches, synopsis).
                Aucune donnée personnelle n&apos;est transmise à TMDb. Politique :{" "}
                <a
                  href="https://www.themoviedb.org/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  themoviedb.org/privacy-policy
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Cookies et stockage local</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Cookies de session</span> — Pixel Night
              utilise un cookie de session strictement nécessaire au maintien de votre
              authentification (organisateurs uniquement). Ce cookie est exempté de consentement
              conformément à l&apos;article 82 de la loi Informatique et Libertés.
            </p>
            <p>
              <span className="font-medium text-foreground">localStorage</span> — Un identifiant
              anonyme est stocké localement dans votre navigateur pour mémoriser vos votes (sans
              compte). Ce n&apos;est pas un cookie ; aucun consentement n&apos;est requis.
            </p>
          </div>
        </section>

        {/* Droits */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Vos droits</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Droit d&apos;accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
            <li>Droit à la portabilité</li>
            <li>Droit d&apos;opposition au traitement</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Pour exercer ces droits, contactez :{" "}
            <a
              href="mailto:contact@helixir.dev"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              contact@helixir.dev
            </a>
            . Vous disposez également du droit d&apos;introduire une réclamation auprès de la{" "}
            <a
              href="https://www.cnil.fr/fr/plaintes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              CNIL
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
