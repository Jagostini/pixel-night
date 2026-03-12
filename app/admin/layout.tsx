"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Palette,
  Calendar,
  Settings,
  ChevronLeft,
  Clapperboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/themes", label: "Themes", icon: Palette, exact: false },
  { href: "/admin/soirees", label: "Soirees", icon: Calendar, exact: false },
  { href: "/admin/parametres", label: "Parametres", icon: Settings, exact: false },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [salleName, setSalleName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSalle() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("sp_salles")
        .select("name")
        .eq("created_by", user.id)
        .maybeSingle()
      setSalleName(data?.name ?? null)
    }
    fetchSalle()
  }, [pathname])

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  // Determine breadcrumb back link
  function getBackLink(): { href: string; label: string } | null {
    if (pathname === "/admin") return null
    if (pathname === "/admin/themes") return { href: "/admin", label: "Dashboard" }
    if (pathname === "/admin/parametres") return { href: "/admin", label: "Dashboard" }
    if (pathname === "/admin/soirees") return { href: "/admin", label: "Dashboard" }
    if (pathname === "/admin/soirees/nouvelle")
      return { href: "/admin/soirees", label: "Soirees" }
    if (pathname.match(/^\/admin\/soirees\/[^/]+$/))
      return { href: "/admin/soirees", label: "Soirees" }
    return { href: "/admin", label: "Dashboard" }
  }

  const back = getBackLink()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Top navigation bar */}
      <nav className="mb-6 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
        {salleName && (
          <div className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
            <Clapperboard className="h-3.5 w-3.5" />
            {salleName}
          </div>
        )}
      </nav>

      {/* Back button breadcrumb */}
      {back && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
            <Link href={back.href}>
              <ChevronLeft className="h-4 w-4" />
              Retour {back.label}
            </Link>
          </Button>
        </div>
      )}

      {children}
    </div>
  )
}
