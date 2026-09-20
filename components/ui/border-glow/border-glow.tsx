"use client"

import { useCallback, useRef, type CSSProperties, type ReactNode } from "react"
import styles from "./border-glow.module.css"

type GlowStyle = CSSProperties & Record<`--${string}`, string | number>

const gradientPositions = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
]
const colorMap = [0, 1, 2, 0, 1, 2, 1]

export function BorderGlow({
  children,
  className = "",
  contentClassName = "",
  colors = ["#ffacd2", "#f5db87", "#c084fc"],
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
  colors?: string[]
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current
      if (!card) return

      const rect = card.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const dx = x - rect.width / 2
      const dy = y - rect.height / 2
      const xEdge = rect.width ? Math.abs(dx) / (rect.width / 2) : 0
      const yEdge = rect.height ? Math.abs(dy) / (rect.height / 2) : 0
      const proximity = Math.min(Math.max(xEdge, yEdge), 1) * 100
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90

      card.style.setProperty("--edge-proximity", proximity.toFixed(3))
      card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`)
    },
    []
  )

  const glowStyle: GlowStyle = {
    "--gradient-base": `linear-gradient(${colors[0]} 0 100%)`,
  }

  gradientPositions.forEach((position, index) => {
    const color = colors[Math.min(colorMap[index], colors.length - 1)]
    glowStyle[`--gradient-${index + 1}`] =
      `radial-gradient(at ${position}, ${color} 0, transparent 50%)`
  })

  return (
    <div
      ref={cardRef}
      className={`${styles.glow} ${className}`}
      style={glowStyle}
      onPointerMove={handlePointerMove}
    >
      <span className={styles.edgeLight} aria-hidden="true" />
      <div className={`${styles.inner} ${contentClassName}`}>{children}</div>
    </div>
  )
}
