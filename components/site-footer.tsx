import Script from "next/script"
import { Film } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4" />
          <span>Pixels Night</span>
        </div>
        <p>{"Organisez vos soirees cine entre amis."}</p>
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
