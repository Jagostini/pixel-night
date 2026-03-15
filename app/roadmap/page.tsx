import { ExternalLink, GitBranch, CheckCircle2, Circle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export const revalidate = 300 // ISR : revalidation toutes les 5 minutes

const GITHUB_REPO = "Jagostini/pixel-night"
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/issues`

interface GitHubIssue {
  number: number
  title: string
  html_url: string
  state: "open" | "closed"
  labels: { name: string; color: string }[]
  body: string | null
  created_at: string
}

async function fetchIssues(): Promise<GitHubIssue[]> {
  try {
    const [open, closed] = await Promise.all([
      fetch(`${GITHUB_API}?state=open&per_page=100&sort=created&direction=desc`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
      }),
      fetch(`${GITHUB_API}?state=closed&per_page=50&sort=updated&direction=desc`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
      }),
    ])
    const openData: GitHubIssue[] = open.ok ? await open.json() : []
    const closedData: GitHubIssue[] = closed.ok ? await closed.json() : []
    return [...openData, ...closedData]
  } catch {
    return []
  }
}

function hasLabel(issue: GitHubIssue, ...names: string[]) {
  return issue.labels.some((l) => names.includes(l.name.toLowerCase()))
}

function labelColor(color: string) {
  return `#${color}`
}

export default async function RoadmapPage() {
  const issues = await fetchIssues()

  const inProgress = issues.filter(
    (i) => i.state === "open" && hasLabel(i, "in progress", "in-progress", "en cours")
  )
  const planned = issues.filter(
    (i) =>
      i.state === "open" &&
      !hasLabel(i, "in progress", "in-progress", "en cours", "bug") &&
      !hasLabel(i, "wontfix", "duplicate", "invalid")
  )
  const bugs = issues.filter(
    (i) => i.state === "open" && hasLabel(i, "bug")
  )
  const done = issues.filter((i) => i.state === "closed").slice(0, 20)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feuille de route</h1>
          <p className="mt-1 text-muted-foreground">
            Suivi des fonctionnalités en développement et à venir.
            Synchronisé avec les issues GitHub.
          </p>
        </div>
        <Link
          href={`https://github.com/${GITHUB_REPO}/issues/new/choose`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <GitBranch className="h-4 w-4" />
          Suggérer une fonctionnalité
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </Link>
      </div>

      {issues.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <p>Aucune donnée disponible pour l&apos;instant.</p>
          <Link
            href={`https://github.com/${GITHUB_REPO}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
          >
            Voir les issues GitHub
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* En cours */}
        {inProgress.length > 0 && (
          <Section
            title="En cours"
            icon={<Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            issues={inProgress}
            repo={GITHUB_REPO}
          />
        )}

        {/* Prévu */}
        {planned.length > 0 && (
          <Section
            title="Prévu"
            icon={<Circle className="h-4 w-4 text-muted-foreground" />}
            issues={planned}
            repo={GITHUB_REPO}
          />
        )}

        {/* Bugs connus */}
        {bugs.length > 0 && (
          <Section
            title="Bugs connus"
            icon={<Circle className="h-4 w-4 text-red-500" />}
            issues={bugs}
            repo={GITHUB_REPO}
          />
        )}

        {/* Terminé */}
        {done.length > 0 && (
          <Section
            title="Terminé"
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            issues={done}
            repo={GITHUB_REPO}
            muted
          />
        )}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Données issues GitHub — mises à jour toutes les 5 minutes.{" "}
        <Link
          href={`https://github.com/${GITHUB_REPO}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          Voir tout sur GitHub
        </Link>
      </p>
    </div>
  )
}

function Section({
  title,
  icon,
  issues,
  muted = false,
}: {
  title: string
  icon: React.ReactNode
  issues: GitHubIssue[]
  repo: string
  muted?: boolean
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-normal">
          {issues.length}
        </span>
      </h2>
      <ul className="space-y-2">
        {issues.map((issue) => (
          <li key={issue.number}>
            <Link
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-accent ${muted ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-snug group-hover:text-primary">
                  {issue.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  #{issue.number}
                </span>
              </div>
              {issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map((label) => (
                    <Badge
                      key={label.name}
                      variant="outline"
                      className="px-1.5 py-0 text-xs"
                      style={{ borderColor: labelColor(label.color), color: labelColor(label.color) }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
