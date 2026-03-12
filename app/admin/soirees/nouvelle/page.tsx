"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import type { SpTheme } from "@/lib/types"

export default function NouvelleSoireePage() {
  const router = useRouter()
  const [salleId, setSalleId] = useState<string | null>(null)
  const [eventDate, setEventDate] = useState("")
  const [projectionTime, setProjectionTime] = useState("")
  const [themeCount, setThemeCount] = useState(4)
  const [filmCount, setFilmCount] = useState(10)
  const [voteDuration, setVoteDuration] = useState<string>("")
  const [proposalEnabled, setProposalEnabled] = useState(false)
  const [proposalDuration, setProposalDuration] = useState<string>("60")
  const [saving, setSaving] = useState(false)
  const [eligibleThemes, setEligibleThemes] = useState<SpTheme[]>([])

  const loadSalleAndThemes = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: salle } = await supabase
      .from("sp_salles")
      .select("id")
      .eq("created_by", user.id)
      .maybeSingle()

    setSalleId(salle?.id ?? null)

    const now = new Date().toISOString()
    let query = supabase
      .from("sp_themes")
      .select("*")
      .eq("is_active", true)
      .or(`excluded_until.is.null,excluded_until.lt.${now}`)

    if (salle) {
      query = query.eq("salle_id", salle.id)
    } else {
      query = query.eq("created_by", user.id)
    }

    const { data } = await query
    setEligibleThemes(data ?? [])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSalleAndThemes()
  }, [loadSalleAndThemes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Non connecte")
      setSaving(false)
      return
    }

    if (eligibleThemes.length < themeCount) {
      toast.error(
        `Il n'y a que ${eligibleThemes.length} themes eligibles. Reduisez le nombre de themes ou ajoutez-en.`
      )
      setSaving(false)
      return
    }

    const durationMinutes = voteDuration ? parseInt(voteDuration, 10) : null
    const themeVoteEnds = durationMinutes
      ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
      : null

    const { data: soiree, error } = await supabase
      .from("sp_soirees")
      .insert({
        event_date: eventDate || null,
        projection_datetime: (eventDate && projectionTime)
          ? new Date(`${eventDate}T${projectionTime}`).toISOString()
          : null,
        theme_count: themeCount,
        film_count: filmCount,
        vote_duration_minutes: durationMinutes,
        theme_vote_ends_at: themeVoteEnds,
        phase: "theme_vote",
        created_by: user.id,
        proposal_enabled: proposalEnabled,
        salle_id: salleId,
      })
      .select()
      .single()

    if (error || !soiree) {
      toast.error(error?.message ?? "Erreur creation")
      setSaving(false)
      return
    }

    const shuffled = [...eligibleThemes].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, themeCount)

    const { error: insertError } = await supabase
      .from("sp_soiree_themes")
      .insert(
        selected.map((t) => ({
          soiree_id: soiree.id,
          theme_id: t.id,
        }))
      )

    if (insertError) {
      toast.error(insertError.message)
      setSaving(false)
      return
    }

    toast.success("Soiree creee !")
    router.push(`/admin/soirees/${soiree.id}`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Nouvelle soiree</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parametres</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-date">Date de la soiree</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="projection-time">
                Heure de projection (optionnel)
              </Label>
              <Input
                id="projection-time"
                type="time"
                value={projectionTime}
                onChange={(e) => setProjectionTime(e.target.value)}
                disabled={!eventDate}
                placeholder="ex: 20:30"
              />
              {!eventDate && (
                <p className="text-xs text-muted-foreground">
                  Renseignez d&apos;abord la date de la soiree.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="theme-count">
                Nombre de themes ({eligibleThemes.length} eligibles)
              </Label>
              <Input
                id="theme-count"
                type="number"
                min={2}
                max={Math.max(eligibleThemes.length, 2)}
                value={themeCount}
                onChange={(e) => setThemeCount(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="film-count">Nombre de films (via TMDb)</Label>
              <Input
                id="film-count"
                type="number"
                min={2}
                max={20}
                value={filmCount}
                onChange={(e) => setFilmCount(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vote-duration">
                Duree du vote (minutes, vide = illimite)
              </Label>
              <Input
                id="vote-duration"
                type="number"
                min={1}
                value={voteDuration}
                onChange={(e) => setVoteDuration(e.target.value)}
                placeholder="ex: 30"
              />
            </div>

            <div className="rounded-lg border p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="proposal-enabled"
                  checked={proposalEnabled}
                  onCheckedChange={(checked) =>
                    setProposalEnabled(checked === true)
                  }
                />
                <Label htmlFor="proposal-enabled" className="cursor-pointer">
                  Permettre aux invites de proposer des films
                </Label>
              </div>
              {proposalEnabled && (
                <div className="flex flex-col gap-2 ml-6">
                  <Label htmlFor="proposal-duration">
                    Duree des propositions (minutes)
                  </Label>
                  <Input
                    id="proposal-duration"
                    type="number"
                    min={1}
                    value={proposalDuration}
                    onChange={(e) => setProposalDuration(e.target.value)}
                    placeholder="ex: 60"
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={saving} className="mt-2">
              {saving ? "Creation..." : "Creer la soiree"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
