import { Film } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4" />
          <span>Soirees Pixels</span>
        </div>
        <p>{"Organisez vos soirees cine entre amis."}</p>
      </div>
    </footer>
  )
}
