import { notFound } from "next/navigation"
import { readFileSync } from "fs"
import path from "path"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, ChevronRight } from "lucide-react"
import type { Components } from "react-markdown"

const ALL_DOCS = [
  { slug: "guide-participant", title: "Guide Participant" },
  { slug: "guide-organisateur", title: "Guide Organisateur" },
  { slug: "architecture", title: "Architecture" },
  { slug: "developer", title: "Guide Développeur" },
  { slug: "ux-design", title: "UX Design" },
  { slug: "api-reference", title: "Référence API" },
  { slug: "sysadmin", title: "Administration" },
  { slug: "devops", title: "DevOps" },
  { slug: "security", title: "Sécurité" },
  { slug: "testing", title: "Tests & QA" },
]

function resolveDocLink(href: string): string {
  // Convert relative .md links to in-app routes
  // e.g. ./architecture.md → /docs/architecture
  // e.g. ../CONTRIBUTING.md → external (keep as-is or point to GitHub)
  if (href.startsWith("./") && href.endsWith(".md")) {
    const slug = href.replace("./", "").replace(".md", "")
    return `/docs/${slug}`
  }
  if (href.startsWith("../") && href.endsWith(".md")) {
    return `https://github.com/Jagostini/pixel-night/blob/main/${href.slice(3)}`
  }
  return href
}

const markdownComponents: Components = {
  a({ href, children }) {
    const resolved = href ? resolveDocLink(href) : "#"
    const isExternal = resolved.startsWith("http")
    return (
      <a
        href={resolved}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    )
  },
}

export async function generateStaticParams() {
  return ALL_DOCS.map((doc) => ({ slug: doc.slug }))
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const docMeta = ALL_DOCS.find((d) => d.slug === slug)
  if (!docMeta) notFound()

  let content: string
  try {
    const filePath = path.join(process.cwd(), "doc", `${slug}.md`)
    content = readFileSync(filePath, "utf-8")
  } catch {
    notFound()
  }

  const currentIndex = ALL_DOCS.findIndex((d) => d.slug === slug)
  const prev = currentIndex > 0 ? ALL_DOCS[currentIndex - 1] : null
  const next = currentIndex < ALL_DOCS.length - 1 ? ALL_DOCS[currentIndex + 1] : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-8">
            <Link
              href="/docs"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Documentation
            </Link>
            <nav className="space-y-0.5">
              {ALL_DOCS.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    doc.slug === slug
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {doc.title}
                  {doc.slug === slug && <ChevronRight className="h-3 w-3" />}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {/* Mobile back link */}
          <Link
            href="/docs"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Documentation
          </Link>

          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-8 prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-table:text-sm prose-th:text-left">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </article>

          {/* Pagination */}
          <div className="mt-12 flex gap-3 border-t border-border pt-6">
            {prev && (
              <Link
                href={`/docs/${prev.slug}`}
                className="flex flex-1 flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <span className="text-xs text-muted-foreground">Précédent</span>
                <span className="text-sm font-medium">← {prev.title}</span>
              </Link>
            )}
            {next && (
              <Link
                href={`/docs/${next.slug}`}
                className="ml-auto flex flex-1 flex-col items-end gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <span className="text-xs text-muted-foreground">Suivant</span>
                <span className="text-sm font-medium">{next.title} →</span>
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
