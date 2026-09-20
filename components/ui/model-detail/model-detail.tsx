"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, ArrowUpRight, Star } from "lucide-react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Model, tiers } from "@/lib/models"
import { getRankings } from "@/lib/model-rankings"
import { averageRating, StarRating } from "@/components/ui/model-ui/model-ui"
import { AuthButton } from "@/components/ui/auth-button/auth-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import styles from "./model-detail.module.css"

export function ModelDetail({
  model,
  modelIds,
}: {
  model: Model
  modelIds: string[]
}) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const community = useQuery(api.ratings.community)
  const stats = community?.find((entry) => entry.modelId === model.id)
  const ranks = getRankings(modelIds, community)
  const overallRank = ranks.overall.get(model.id)
  const popularity = ranks.popularity.get(model.id)
  const mine = useQuery(api.ratings.mine, isAuthenticated ? {} : "skip")
  const entry = mine?.find((entry) => entry.modelId === model.id)
  const rating = entry?.stars ?? 0
  const rate = useMutation(api.ratings.rate)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [ratingOpen, setRatingOpen] = useState(false)
  const [draftRating, setDraftRating] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [draftNotes, setDraftNotes] = useState("")

  function openRating() {
    setDraftRating((entry?.stars ?? 3) as 1 | 2 | 3 | 4 | 5)
    setDraftNotes(entry?.notes ?? "")
    setMessage("")
    setRatingOpen(true)
  }

  async function save(stars: 1 | 2 | 3 | 4 | 5 | null, notes = "") {
    setBusy(true)
    setMessage("")
    try {
      await rate({ modelId: model.id, stars, notes })
      setMessage(stars ? "Rating saved." : "Rating removed.")
      setRatingOpen(false)
    } catch {
      setMessage("Couldn't save your rating. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/models" className={styles.back}>
        <ArrowLeft size={14} /> Models
      </Link>
      <header className={styles.profileHeader}>
        <div>
          <h1>{model.name}</h1>
        </div>
      </header>

      <section
        className={styles.stats}
        aria-label="Community statistics"
        aria-busy={community === undefined}
      >
        <div>
          <span className={styles.statLabel}>Rating</span>
          <strong>
            {community === undefined
              ? "…"
              : stats?.count
                ? averageRating(stats).toFixed(2)
                : "—"}
            <small> / 5</small>
          </strong>
        </div>
        <div>
          <span className={styles.statLabel}>Overall rank</span>
          <strong>
            {community === undefined
              ? "…"
              : overallRank
                ? `#${overallRank}`
                : "—"}
          </strong>
        </div>
        <div>
          <span className={styles.statLabel}>Ratings</span>
          <strong>
            {community === undefined
              ? "…"
              : (stats?.count ?? 0).toLocaleString()}
          </strong>
        </div>
        <div>
          <span className={styles.statLabel}>Popularity</span>
          <strong>
            {community === undefined
              ? "…"
              : popularity
                ? `#${popularity}`
                : "—"}
          </strong>
        </div>
      </section>

      <div className={styles.profileBody}>
        <aside>
          <section className={styles.panel}>
            <h2>Your rating</h2>
            {isAuthenticated ? (
              <>
                {rating > 0 && (
                  <div aria-label={`Your rating: ${rating} out of 5`}>
                    <StarRating value={rating} disabled onChange={() => {}} />
                  </div>
                )}
                <Button
                  type="button"
                  disabled={busy || mine === undefined}
                  onClick={openRating}
                  className="mt-4 w-full"
                >
                  {rating > 0 ? "Change rating" : "Add rating"}
                </Button>
              </>
            ) : (
              <div className={styles.signIn}>
                <p>
                  {isLoading
                    ? "Checking your session…"
                    : "Sign in to add your rating."}
                </p>
                <AuthButton />
              </div>
            )}
            <p className={styles.feedback} role="status">
              {busy ? "Saving…" : message}
            </p>
            <Link className={styles.listLink} href="/my-list">
              My list <ArrowUpRight size={14} />
            </Link>
          </section>
          <section className={styles.information}>
            <h2>Information</h2>
            <dl>
              <dt>Provider</dt>
              <dd>{model.provider}</dd>
              <dt>Family</dt>
              <dd>{model.family}</dd>
              <dt>Access</dt>
              <dd>{model.access}</dd>
              <dt>Context</dt>
              <dd>{model.status}</dd>
              {model.createdAt > 0 && (
                <>
                  <dt>Released</dt>
                  <dd>
                    {new Date(model.createdAt * 1000).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      }
                    )}
                  </dd>
                </>
              )}
            </dl>
          </section>
        </aside>
        <div className={styles.profileContent}>
          <section>
            <h2 className={styles.sectionHeading}>About</h2>
            <p className={styles.description}>{model.description}</p>
            <div className={styles.tags}>
              {model.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
          <section>
            <div className={styles.breakdownHeading}>
              <h2 className={styles.sectionHeading}>Rating breakdown</h2>
              <span>
                {community === undefined
                  ? "Loading…"
                  : `${stats?.count ?? 0} ratings`}
              </span>
            </div>
            <div className={styles.distribution}>
              {tiers.map((tier) => {
                const count = stats?.distribution[tier.stars - 1] ?? 0
                const percent = stats?.count ? (count / stats.count) * 100 : 0
                return (
                  <div key={tier.stars} className={styles.distributionRow}>
                    <span>
                      {tier.stars} <Star size={11} aria-hidden="true" />
                    </span>
                    <div
                      className={styles.track}
                      role="meter"
                      aria-label={`${tier.stars} stars`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                      aria-valuetext={`${count} ratings`}
                    >
                      <div style={{ width: `${percent}%` }} />
                    </div>
                    <span>{count.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
            {community !== undefined && !stats?.count && (
              <p className={styles.muted}>No ratings yet.</p>
            )}
          </section>
        </div>
      </div>
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent>
          <div>
            <DialogTitle>
              {rating > 0 ? "Change rating" : "Add rating"}
            </DialogTitle>
            <DialogDescription className="mt-2">{model.name}</DialogDescription>
          </div>
          <div>
            <StarRating
              value={draftRating}
              onChange={setDraftRating}
              disabled={busy}
            />
            <label className="mt-4 block text-sm">
              Notes <span className="text-muted-foreground">(optional)</span>
              <Textarea
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                maxLength={2000}
                rows={5}
                className="mt-2"
              />
            </label>
            <div className="mt-5 flex items-center justify-between gap-3">
              {rating > 0 ? (
                <Button
                  variant="ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => save(null)}
                >
                  Remove rating
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                disabled={busy}
                onClick={() => save(draftRating, draftNotes)}
              >
                {busy ? "Saving…" : "Save rating"}
              </Button>
            </div>
            {message && (
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
