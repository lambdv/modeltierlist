"use client"

import { useState } from "react"
import Link from "next/link"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { Check, GripVertical, Plus, Share2 } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { type Model, tiers } from "@/lib/models"
import { StarRating } from "@/components/ui/model-ui/model-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type Stars = 1 | 2 | 3 | 4 | 5 | null
type Change = { modelId: string; stars: Stars; notes: string }

export function Profile({
  userId,
  models,
}: {
  userId: string
  models: Model[]
}) {
  return <ProfileContent key={userId} userId={userId} models={models} />
}

function ProfileContent({
  userId,
  models,
}: {
  userId: string
  models: Model[]
}) {
  const profile = useQuery(api.ratings.profile, { userId })
  const { data: session } = authClient.useSession()
  const { isAuthenticated } = useConvexAuth()
  const owner = isAuthenticated && session?.user.id === userId
  const rate = useMutation(api.ratings.rate).withOptimisticUpdate(
    (store, change) => {
      const current = store.getQuery(api.ratings.profile, { userId })
      if (!current) return
      const ratings = current.ratings.filter(
        (r) => r.modelId !== change.modelId
      )
      if (change.stars !== null)
        ratings.push({
          modelId: change.modelId,
          stars: change.stars,
          notes: change.notes ?? "",
        })
      store.setQuery(api.ratings.profile, { userId }, { ...current, ratings })
    }
  )
  const [pending, setPending] = useState<Record<string, Change>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorQuery, setEditorQuery] = useState("")
  const [editorModelId, setEditorModelId] = useState("")
  const [editorStars, setEditorStars] = useState<Exclude<Stars, null>>(3)
  const [editorNotes, setEditorNotes] = useState("")

  function move(modelId: string, stars: number) {
    if (!owner) return
    const existing =
      pending[modelId] ?? profile?.ratings.find((r) => r.modelId === modelId)
    const change: Change = {
      modelId,
      stars: stars === 0 ? null : (stars as Stars),
      notes: existing?.notes ?? "",
    }
    setPending((current) => ({ ...current, [modelId]: change }))
    setError("")
    setDragging(null)
    setOver(null)
  }

  async function saveChanges() {
    const changes = Object.values(pending)
    if (!changes.length || saving) return
    setSaving(true)
    setError("")
    try {
      await Promise.all(
        changes.map(({ modelId, stars, notes }) =>
          rate({ modelId, stars, notes })
        )
      )
      setPending({})
    } catch {
      setError("Some changes couldn't be saved. Your edits are still here.")
    } finally {
      setSaving(false)
    }
  }

  if (profile === undefined)
    return (
      <main
        className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground sm:px-6"
        role="status"
      >
        Loading profile…
      </main>
    )
  if (profile === null)
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-xl font-semibold">Profile not found</h1>
        <Link
          href="/"
          className="mt-4 inline-block text-sm underline underline-offset-4"
        >
          Back to rankings
        </Link>
      </main>
    )

  const ratings = new Map(profile.ratings.map((r) => [r.modelId, r.stars]))
  for (const change of Object.values(pending)) {
    if (change.stars === null) ratings.delete(change.modelId)
    else ratings.set(change.modelId, change.stars)
  }
  const catalog = [...models]
  for (const id of ratings.keys()) {
    if (!catalog.some((model) => model.id === id))
      catalog.push({
        id,
        name: id.split("/").pop() ?? id,
        provider: id.split("/")[0],
        symbol: "◈",
        createdAt: 0,
      } as Model)
  }
  const unranked = models
    .filter((model) => !ratings.has(model.id))
    .sort((a, b) => b.createdAt - a.createdAt)
  const search = query.trim().toLowerCase()
  const matches = search
    ? unranked.filter((model) =>
        `${model.name} ${model.provider} ${model.id}`
          .toLowerCase()
          .includes(search)
      )
    : unranked.slice(0, 12)
  const dirty = Object.keys(pending).length > 0
  const editorSearch = editorQuery.trim().toLowerCase()
  const editorModels = models
    .filter(
      (model) =>
        !ratings.has(model.id) &&
        (!editorSearch ||
          `${model.name} ${model.provider} ${model.id}`
            .toLowerCase()
            .includes(editorSearch))
    )
    .slice(0, 30)

  function editRating(modelId: string) {
    const current =
      pending[modelId] ?? profile!.ratings.find((r) => r.modelId === modelId)
    setEditorModelId(modelId)
    setEditorStars((current?.stars ?? 3) as Exclude<Stars, null>)
    setEditorNotes(current?.notes ?? "")
    setEditorQuery("")
    setEditorOpen(true)
  }

  function stageRating() {
    if (!editorModelId) return
    setPending((current) => ({
      ...current,
      [editorModelId]: {
        modelId: editorModelId,
        stars: editorStars,
        notes: editorNotes,
      },
    }))
    setError("")
    setEditorOpen(false)
  }

  function card(model: Model, stars: number) {
    return (
      <div
        key={model.id}
        draggable={owner}
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", model.id)
          event.dataTransfer.effectAllowed = "move"
          setDragging(model.id)
        }}
        onDragEnd={() => {
          setDragging(null)
          setOver(null)
        }}
        className={`w-full rounded-lg border p-3 sm:w-56 ${owner ? "cursor-grab active:cursor-grabbing" : ""} ${dragging === model.id ? "opacity-40" : ""}`}
      >
        <div className="flex items-start gap-2">
          <Link
            draggable={false}
            href={`/model/${model.id}`}
            className="min-w-0 flex-1 text-sm break-words hover:underline"
          >
            {model.name}
          </Link>
          {owner && (
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
        {owner && (
          <div className="mt-3 flex gap-2">
            <NativeSelect
              aria-label={`Tier for ${model.name}`}
              value={stars}
              onChange={(event) => move(model.id, Number(event.target.value))}
              className="min-w-0 flex-1"
              size="sm"
            >
              <NativeSelectOption value={0}>Unranked</NativeSelectOption>
              {tiers.map((tier) => (
                <NativeSelectOption key={tier.stars} value={tier.stars}>
                  {tier.letter} · {tier.stars}/5
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {stars > 0 && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => editRating(model.id)}
              >
                Notes
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <section>
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            {profile.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.user.image}
                alt={`${profile.user.name}'s avatar`}
                referrerPolicy="no-referrer"
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                {profile.user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/user/${encodeURIComponent(userId)}`
                  )
                  setCopied(true)
                  setShareError("")
                } catch {
                  setShareError(
                    "Couldn't copy the link. Copy the profile URL from your address bar."
                  )
                }
              }}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Share2 className="size-4" />
              )}
              {copied ? "Copied" : "Share"}
            </Button>
          </div>
          <h1 className="text-xl font-semibold break-words">
            {profile.user.name}
          </h1>
          {shareError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {shareError}
            </p>
          )}
          <div className="mt-2 text-sm text-muted-foreground">
            <span>{ratings.size} models ranked</span>
          </div>
        </div>
      </section>
      <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Tier list</h2>
        </div>
        {owner ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span role="status" className="text-xs text-muted-foreground">
              {saving
                ? "Saving changes…"
                : dirty
                  ? `${Object.keys(pending).length} unsaved change${Object.keys(pending).length === 1 ? "" : "s"}`
                  : "Saved"}
            </span>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setEditorModelId("")
                setEditorStars(3)
                setEditorNotes("")
                setEditorQuery("")
                setEditorOpen(true)
              }}
            >
              <Plus className="size-4" /> Add model
            </Button>
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={saveChanges}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        ) : null}
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}{" "}
          {owner && (
            <button className="underline" onClick={() => setError("")}>
              Dismiss
            </button>
          )}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border">
        {tiers.map((tier) => {
          const entries = catalog.filter(
            (model) => ratings.get(model.id) === tier.stars
          )
          return (
            <section
              key={tier.stars}
              aria-label={`${tier.letter}: ${tier.label}`}
              onDragOver={(event) => {
                if (owner && dragging) {
                  event.preventDefault()
                  setOver(tier.stars)
                }
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(event) => {
                event.preventDefault()
                if (dragging) move(dragging, tier.stars)
              }}
              className={`grid min-h-24 grid-cols-[48px_minmax(0,1fr)] border-b last:border-0 sm:grid-cols-[64px_minmax(0,1fr)] ${over === tier.stars ? "bg-accent" : ""}`}
            >
              <div className="flex items-center justify-center border-r bg-muted/30">
                <span className="text-lg font-medium">{tier.letter}</span>
              </div>
              <div className="flex flex-wrap content-center gap-2 p-3">
                {entries.length ? (
                  entries.map((model) => card(model, tier.stars))
                ) : (
                  <p className="self-center text-sm text-muted-foreground">
                    {owner ? "Drop here" : "—"}
                  </p>
                )}
              </div>
            </section>
          )
        })}
      </div>
      {owner && (
        <section
          className={`mt-8 rounded-lg border p-4 ${over === 0 ? "bg-accent" : ""}`}
          onDragOver={(event) => {
            if (dragging) {
              event.preventDefault()
              setOver(0)
            }
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(event) => {
            event.preventDefault()
            if (dragging) move(dragging, 0)
          }}
        >
          <h2 className="mb-4 text-sm font-medium">Unranked</h2>
          <Input
            aria-label="Search all unranked models"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models"
            type="search"
          />
          <p className="my-4 text-xs text-muted-foreground">
            {search
              ? `${matches.length} models`
              : `${matches.length} latest models`}
          </p>
          <div className="flex flex-wrap gap-3">
            {matches.map((model) => card(model, 0))}
          </div>
          {!matches.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search
                ? "No unranked models match your search."
                : "You’ve ranked every available model."}
            </p>
          )}
        </section>
      )}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <div>
            <DialogTitle>
              {editorModelId && ratings.has(editorModelId)
                ? "Edit rating"
                : "Add model"}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {editorModelId
                ? catalog.find((model) => model.id === editorModelId)?.name
                : "Choose a model."}
            </DialogDescription>
          </div>
          <div className="grid min-h-0 gap-4">
            <div className="min-w-0">
              {!editorModelId ? (
                <>
                  <Input
                    autoFocus
                    type="search"
                    value={editorQuery}
                    onChange={(event) => setEditorQuery(event.target.value)}
                    placeholder="Search models"
                    aria-label="Search models to rate"
                  />
                  <div className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">
                    {editorModels.map((model) => (
                      <Button
                        variant="ghost"
                        key={model.id}
                        type="button"
                        onClick={() => editRating(model.id)}
                        className="h-auto w-full justify-start py-2 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {model.name}
                          </span>
                        </span>
                      </Button>
                    ))}
                    {!editorModels.length && (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No models found.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setEditorModelId("")}
                    className="mb-4"
                  >
                    ← Change model
                  </Button>
                  <StarRating value={editorStars} onChange={setEditorStars} />
                  <label className="mt-4 block text-sm">
                    Notes{" "}
                    <span className="text-muted-foreground">(optional)</span>
                    <Textarea
                      value={editorNotes}
                      onChange={(event) => setEditorNotes(event.target.value)}
                      maxLength={2000}
                      rows={6}
                      className="mt-2"
                    />
                  </label>
                </div>
              )}
            </div>
            {editorModelId && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={!editorModelId}
                  onClick={stageRating}
                >
                  {ratings.has(editorModelId) ? "Update rating" : "Add rating"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
