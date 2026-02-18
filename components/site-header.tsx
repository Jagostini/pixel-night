"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Film, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = pathname.startsWith("/admin")

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Film className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            Pixels Night
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(!isAdmin && "text-primary")}
          >
            <Link href="/">Accueil</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(isAdmin && "text-primary")}
          >
            <Link href="/admin">Organisateur</Link>
          </Button>
        </nav>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn("justify-start", !isAdmin && "text-primary")}
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/">Accueil</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn("justify-start", isAdmin && "text-primary")}
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/admin">Organisateur</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  )
}
