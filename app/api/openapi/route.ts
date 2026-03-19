import { readFileSync } from "fs"
import { join } from "path"
import { version } from "@/package.json"

const raw = readFileSync(join(process.cwd(), "openapi.yaml"), "utf-8")
const spec = raw.replace(/^(\s*version:\s*)[\d.]+(-[\w.]+)?/m, `$1${version}`)

export async function GET() {
  return new Response(spec, {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
