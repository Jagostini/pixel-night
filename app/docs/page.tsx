import Link from "next/link"
import {
  ArrowRight,
  Code,
  Clapperboard,
  Layers,
  Palette,
  Server,
  Shield,
  TestTube2,
  Users,
  Workflow,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface DocEntry {
  slug: string
  title: string
  description: string
  icon: LucideIcon
}

interface DocSection {
  title: string
  docs: DocEntry[]
}

const DOCS_SECTIONS: DocSection[] = [
  {
    title: "Guides utilisateurs",
    docs: [
      {
        slug: "guide-participant",
        title: "Guide Participant",
        description: "Rejoindre une soirée, voter pour un thème, proposer et voter pour un film.",
        icon: Users,
      },
      {
        slug: "guide-organisateur",
        title: "Guide Organisateur",
        description: "Créer une soirée, gérer les phases, partager le lien avec les participants.",
        icon: Clapperboard,
      },
    ],
  },
  {
    title: "Technique",
    docs: [
      {
        slug: "architecture",
        title: "Architecture",
        description: "Schémas système, modèle de données, choix techniques, flux d'authentification.",
        icon: Layers,
      },
      {
        slug: "developer",
        title: "Guide Développeur",
        description: "Setup local, structure du projet, conventions TypeScript, lib/, API routes.",
        icon: Code,
      },
      {
        slug: "ux-design",
        title: "UX Design",
        description: "Parcours utilisateurs, inventaire des écrans, système de design, accessibilité.",
        icon: Palette,
      },
      {
        slug: "api-reference",
        title: "Référence API",
        description: "Tous les endpoints REST — paramètres, réponses, codes d'erreur.",
        icon: Zap,
      },
    ],
  },
  {
    title: "Déploiement",
    docs: [
      {
        slug: "sysadmin",
        title: "Administration Système",
        description: "Variables d'environnement, configuration Supabase, migrations SQL, token TMDb.",
        icon: Server,
      },
      {
        slug: "devops",
        title: "DevOps",
        description: "Vercel, GitHub Actions CI/CD, protection de branche, monitoring.",
        icon: Workflow,
      },
    ],
  },
  {
    title: "Qualité",
    docs: [
      {
        slug: "security",
        title: "Sécurité",
        description: "Modèle de menaces, politiques RLS, chiffrement AES-256-GCM, anonymat.",
        icon: Shield,
      },
      {
        slug: "testing",
        title: "Tests & QA",
        description: "Plan de test manuel (40+ cas), tests unitaires Vitest, outils recommandés.",
        icon: TestTube2,
      },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-2 text-muted-foreground">
          Tout ce qu&apos;il faut savoir pour utiliser, déployer et contribuer à Pixel Night.
        </p>
      </div>

      <div className="space-y-10">
        {DOCS_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.docs.map((doc) => {
                const Icon = doc.icon
                return (
                  <Link
                    key={doc.slug}
                    href={`/docs/${doc.slug}`}
                    className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="mt-0.5 shrink-0 rounded-md border border-border bg-background p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium leading-tight">{doc.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-dashed border-border p-5">
        <p className="text-sm text-muted-foreground">
          Vous cherchez la documentation API interactive (OpenAPI / Redoc) ?{" "}
          <Link href="/docs/api" className="text-foreground underline underline-offset-4 hover:text-primary">
            Ouvrir Redoc →
          </Link>
        </p>
      </div>
    </div>
  )
}
