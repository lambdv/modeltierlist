"use client"

import { Card as MaterialCard, type CardProps } from "m3you"
import { cn } from "@/lib/utils"

export function Card({ className, ...props }: CardProps) {
  return (
    <MaterialCard
      data-slot="card"
      className={cn("app-card", className)}
      {...props}
    />
  )
}
