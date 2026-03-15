import Script from "next/script"
import Link from "next/link"
import { Film, Github, Map, BookOpen, Heart } from "lucide-react"

const GITHUB_URL = "https://github.com/Jagostini/pixel-night"

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4">
        {/* Brand */}
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Film className="h-4 w-4" />
            <span>Pixel Night</span>
          </div>
          <p className="text-xs">Organisez vos soirées ciné entre amis.</p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:justify-start">
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Map className="h-3 w-3" />
            Feuille de route
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <BookOpen className="h-3 w-3" />
            Documentation API
          </Link>
          <a
            href={`${GITHUB_URL}#readme`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <BookOpen className="h-3 w-3" />
            Documentation
          </a>
          <a
            href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Heart className="h-3 w-3" />
            Contribuer
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Github className="h-3 w-3" />
            GitHub
          </a>
        </nav>

        {/* Bottom */}
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          MIT + Commons Clause — Open source, contributions bienvenues.
        </p>
      </div>

      <Script
        src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
        data-name="BMC-Widget"
        data-cfasync="false"
        data-id="agostinij86"
        data-description="Support me on Buy me a coffee!"
        data-message=""
        data-color="#FF813F"
        data-position="Right"
        data-x_margin="18"
        data-y_margin="18"
        strategy="lazyOnload"
      />
    </footer>
  )
}
