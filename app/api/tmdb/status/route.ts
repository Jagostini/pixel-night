import { NextResponse } from "next/server"
import { getActiveTmdbToken } from "@/lib/tmdb-token"

export async function GET() {
  return NextResponse.json({ configured: !!getActiveTmdbToken() })
}
