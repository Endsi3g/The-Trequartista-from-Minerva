"use client"

// Cult UI (nolly-studio/cult-ui) -- installed manually since the registry
// endpoint was rate-limiting the shadcn CLI; content matches the upstream
// registry/default/ui/animated-number.tsx verbatim.
import { useEffect } from "react"
import { motion, MotionValue, useSpring, useTransform } from "motion/react"

interface AnimatedNumberProps {
  value: number
  mass?: number
  stiffness?: number
  damping?: number
  precision?: number
  formatDecimals?: number
  format?: (value: number) => string
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
}

export function AnimatedNumber({
  value,
  mass = 0.8,
  stiffness = 75,
  damping = 15,
  precision = 0,
  formatDecimals,
  format = (num) => num.toLocaleString(),
  onAnimationStart,
  onAnimationComplete,
}: AnimatedNumberProps) {
  const effPrecision = formatDecimals !== undefined ? formatDecimals : precision
  const spring = useSpring(value, { mass, stiffness, damping })
  const display: MotionValue<string> = useTransform(spring, (current) =>
    format(parseFloat(current.toFixed(effPrecision)))
  )

  useEffect(() => {
    spring.set(value)
    if (onAnimationStart) onAnimationStart()
    const unsubscribe = spring.on("change", () => {
      if (spring.get() === value && onAnimationComplete) onAnimationComplete()
    })
    return () => unsubscribe()
  }, [spring, value, onAnimationStart, onAnimationComplete])

  return <motion.span>{display}</motion.span>
}
