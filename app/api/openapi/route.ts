import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  const yaml = readFileSync(join(process.cwd(), "openapi.yaml"), "utf-8")
  const { version } = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf-8")
  ) as { version: string }

  const patched = yaml.replace(/^(\s*version:\s*)[\d.]+(-\w+)?/m, `$1${version}`)

  return new Response(patched, {
    headers: { "Content-Type": "application/yaml; charset=utf-8" },
  })
}
