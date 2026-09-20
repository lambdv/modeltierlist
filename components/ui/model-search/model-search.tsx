"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProviderIcon } from "@/components/ui/model-ui/model-ui"
import { modelDisplayName } from "@/lib/models"

type SearchModel = { id: string; name: string; provider: string }

export function ModelSearch({ models }: { models: SearchModel[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const search = query.trim().toLowerCase()
  const results = models
    .filter((model) =>
      `${model.name} ${model.provider} ${model.id}`
        .toLowerCase()
        .includes(search)
    )
    .slice(0, 8)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) setQuery("")
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Search models" />
        }
      >
        <Search />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Search models</DialogTitle>
        <Input
          aria-label="Search models"
          placeholder="Model or provider"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="max-h-[55vh] overflow-y-auto">
          {results.length ? (
            results.map((model) => (
              <Link
                key={model.id}
                href={`/models/${encodeURIComponent(model.id)}`}
                onClick={() => {
                  setOpen(false)
                  setQuery("")
                }}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-accent focus-visible:bg-accent"
              >
                <span className="min-w-0 truncate text-sm">
                  {modelDisplayName(model)}
                </span>
                <ProviderIcon id={model.id} provider={model.provider} />
              </Link>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No models found.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
