"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Settings,
  Clapperboard,
  Copy,
  DoorOpen,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import type { SpSalle, SpSalleRoom, ExclusionMode } from "@/lib/types"

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function ParametresPage() {
  // Cinéma state
  const [salle, setSalle] = useState<SpSalle | null>(null)
  const [salleName, setSalleName] = useState("")
  const [salleSlug, setSalleSlug] = useState("")
  const [salleOriginalName, setSalleOriginalName] = useState("")
  const [salleOriginalSlug, setSalleOriginalSlug] = useState("")
  const [savingSalle, setSavingSalle] = useState(false)
  const [salleUrl, setSalleUrl] = useState("")

  // Exclusion rules state
  const [exclusionMode, setExclusionMode] = useState<ExclusionMode>("soirees")
  const [exclusionValue, setExclusionValue] = useState(5)
  const [savingExclusion, setSavingExclusion] = useState(false)
  const [originalExclusionMode, setOriginalExclusionMode] = useState<ExclusionMode>("soirees")
  const [originalExclusionValue, setOriginalExclusionValue] = useState(5)

  // Rooms state
  const [rooms, setRooms] = useState<SpSalleRoom[]>([])
  const [roomEdits, setRoomEdits] = useState<Record<string, { name: string; capacity: string }>>({})
  const [savingRoom, setSavingRoom] = useState<string | null>(null)
  const [addingRoom, setAddingRoom] = useState(false)

  const loadSalle = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("sp_salles")
      .select("*")
      .eq("created_by", user.id)
      .maybeSingle()

    if (data) {
      setSalle(data as SpSalle)
      setSalleName(data.name)
      setSalleSlug(data.slug)
      setSalleOriginalName(data.name)
      setSalleOriginalSlug(data.slug)
      setSalleUrl(`${window.location.origin}/s/${data.slug}`)
      setExclusionMode((data as SpSalle).exclusion_mode ?? "soirees")
      setExclusionValue((data as SpSalle).exclusion_value ?? 5)
      setOriginalExclusionMode((data as SpSalle).exclusion_mode ?? "soirees")
      setOriginalExclusionValue((data as SpSalle).exclusion_value ?? 5)
    }
  }, [])

  const loadRooms = useCallback(async () => {
    if (!salle) return
    const supabase = createClient()
    const { data } = await supabase
      .from("sp_salle_rooms")
      .select("*")
      .eq("salle_id", salle.id)
      .order("room_order", { ascending: true })

    const roomList = (data ?? []) as SpSalleRoom[]
    setRooms(roomList)
    const edits: Record<string, { name: string; capacity: string }> = {}
    for (const r of roomList) {
      edits[r.id] = { name: r.name ?? "", capacity: r.capacity?.toString() ?? "" }
    }
    setRoomEdits(edits)
  }, [salle])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadSalle() }, [loadSalle])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (salle) void loadRooms() }, [salle, loadRooms])

  function handleSalleNameChange(value: string) {
    setSalleName(value)
    setSalleSlug(toSlug(value))
  }

  async function handleSaveSalle() {
    if (!salleName.trim() || !salleSlug.trim()) {
      toast.error("Renseignez le nom et le code")
      return
    }
    setSavingSalle(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("Non connecte"); setSavingSalle(false); return }

    const { error } = await supabase
      .from("sp_salles")
      .update({ name: salleName.trim(), slug: salleSlug.trim() })
      .eq("created_by", user.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Cinema mis a jour !")
      setSalleOriginalName(salleName.trim())
      setSalleOriginalSlug(salleSlug.trim())
      setSalleUrl(`${window.location.origin}/s/${salleSlug.trim()}`)
    }
    setSavingSalle(false)
  }

  async function handleSaveExclusion() {
    if (!salle) return
    setSavingExclusion(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("sp_salles")
      .update({ exclusion_mode: exclusionMode, exclusion_value: exclusionValue })
      .eq("id", salle.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Regle d'exclusion sauvegardee !")
      setOriginalExclusionMode(exclusionMode)
      setOriginalExclusionValue(exclusionValue)
    }
    setSavingExclusion(false)
  }

  async function handleSaveRoom(roomId: string) {
    const edit = roomEdits[roomId]
    if (!edit) return
    setSavingRoom(roomId)
    const supabase = createClient()
    const { error } = await supabase
      .from("sp_salle_rooms")
      .update({
        name: edit.name.trim() || null,
        capacity: edit.capacity ? parseInt(edit.capacity, 10) : null,
      })
      .eq("id", roomId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Salle mise a jour !")
      loadRooms()
    }
    setSavingRoom(null)
  }

  async function handleAddRoom() {
    if (!salle) return
    setAddingRoom(true)
    const supabase = createClient()
    const nextOrder = rooms.length > 0 ? Math.max(...rooms.map((r) => r.room_order)) + 1 : 1
    const { error } = await supabase
      .from("sp_salle_rooms")
      .insert({ salle_id: salle.id, name: null, capacity: null, room_order: nextOrder })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Nouvelle salle ajoutee !")
      loadRooms()
    }
    setAddingRoom(false)
  }

  async function handleDeleteRoom(roomId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("sp_salle_rooms").delete().eq("id", roomId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Salle supprimee")
      loadRooms()
    }
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(salleUrl)
      toast.success("Lien copie !")
    } catch { toast.error("Impossible de copier") }
  }

  const salleChanged = salleName !== salleOriginalName || salleSlug !== salleOriginalSlug
  const exclusionChanged = exclusionMode !== originalExclusionMode || exclusionValue !== originalExclusionValue

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6 text-primary" />
          Parametres
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez votre cinema, vos salles et les services externes.
        </p>
      </div>

      {/* Mon Cinéma */}
      {salle && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clapperboard className="h-4 w-4" />
              Mon Cinema
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-name">Nom du cinema</Label>
              <Input
                id="salle-name"
                value={salleName}
                onChange={(e) => handleSalleNameChange(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-slug">Code d&apos;accès participants</Label>
              <Input
                id="salle-slug"
                value={salleSlug}
                onChange={(e) => setSalleSlug(e.target.value)}
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                Les participants saisissent ce code sur la page d&apos;accueil pour rejoindre votre cinema.
              </p>
            </div>
            {salleUrl && (
              <div className="flex flex-col gap-2">
                <Label>URL de partage</Label>
                <div className="flex items-center gap-2">
                  <Input value={salleUrl} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={handleCopyUrl} className="shrink-0">
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copier le lien</span>
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Button size="sm" onClick={handleSaveSalle} disabled={savingSalle || !salleChanged}>
                {savingSalle ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Règles d'exclusion des thèmes */}
      {salle && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Règle d&apos;exclusion des themes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Après une soirée, le thème gagnant est automatiquement exclu pour éviter
              qu&apos;il revienne trop tôt dans les prochains votes.
            </p>
            <div className="flex flex-col gap-3">
              {(["none", "soirees", "days"] as ExclusionMode[]).map((mode) => (
                <label key={mode} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exclusion_mode"
                    value={mode}
                    checked={exclusionMode === mode}
                    onChange={() => setExclusionMode(mode)}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col gap-0.5">
                    {mode === "none" && (
                      <>
                        <span className="text-sm font-medium">Aucune exclusion</span>
                        <span className="text-xs text-muted-foreground">Le thème peut revenir à la soirée suivante</span>
                      </>
                    )}
                    {mode === "soirees" && (
                      <>
                        <span className="text-sm font-medium">Par nombre de soirées</span>
                        <span className="text-xs text-muted-foreground">Exclu pendant N × 30 jours</span>
                        {exclusionMode === "soirees" && (
                          <div className="mt-1 flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={24}
                              value={exclusionValue}
                              onChange={(e) => setExclusionValue(parseInt(e.target.value, 10) || 1)}
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              soirée{exclusionValue > 1 ? "s" : ""} ({exclusionValue * 30} jours)
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {mode === "days" && (
                      <>
                        <span className="text-sm font-medium">Par durée en jours</span>
                        <span className="text-xs text-muted-foreground">Exclu pendant un nombre précis de jours</span>
                        {exclusionMode === "days" && (
                          <div className="mt-1 flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              value={exclusionValue}
                              onChange={(e) => setExclusionValue(parseInt(e.target.value, 10) || 1)}
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">jour{exclusionValue > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div>
              <Button size="sm" onClick={handleSaveExclusion} disabled={savingExclusion || !exclusionChanged}>
                {savingExclusion ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mes Salles */}
      {salle && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <DoorOpen className="h-4 w-4" />
                Mes Salles
              </CardTitle>
              <Button size="sm" variant="outline" onClick={handleAddRoom} disabled={addingRoom}>
                <Plus className="mr-1 h-4 w-4" />
                Ajouter une salle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Chaque salle peut accueillir une projection distincte. Vous pouvez organiser
              plusieurs soirées simultanées dans des salles différentes.
            </p>
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucune salle configuree.</p>
            ) : (
              rooms.map((room, idx) => {
                const edit = roomEdits[room.id] ?? { name: "", capacity: "" }
                const changed =
                  edit.name !== (room.name ?? "") ||
                  edit.capacity !== (room.capacity?.toString() ?? "")

                return (
                  <div key={room.id} className="flex items-end gap-3 rounded-lg border p-3">
                    <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Nom (optionnel)</Label>
                        <Input
                          placeholder={`Salle ${idx + 1}`}
                          value={edit.name}
                          onChange={(e) =>
                            setRoomEdits((prev) => ({
                              ...prev,
                              [room.id]: { ...prev[room.id], name: e.target.value },
                            }))
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Capacité (optionnel)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder="ex: 150"
                          value={edit.capacity}
                          onChange={(e) =>
                            setRoomEdits((prev) => ({
                              ...prev,
                              [room.id]: { ...prev[room.id], capacity: e.target.value },
                            }))
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleSaveRoom(room.id)}
                        disabled={savingRoom === room.id || !changed}
                        className="h-8"
                      >
                        {savingRoom === room.id ? "..." : "Sauver"}
                      </Button>
                      {rooms.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRoom(room.id)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
