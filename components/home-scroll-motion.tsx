"use client"

import type { ReactNode } from "react"
import { useRef, useSyncExternalStore } from "react"
import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react"

type RevealProps = {
  children: ReactNode
  delay?: number
  amount?: number
}

type DivRevealProps = RevealProps &
  Omit<
    HTMLMotionProps<"div">,
    "animate" | "initial" | "transition" | "viewport" | "whileInView"
  >
type SectionRevealProps = RevealProps &
  Omit<
    HTMLMotionProps<"section">,
    "animate" | "initial" | "transition" | "viewport" | "whileInView"
  >

function useRevealMotion<T extends HTMLElement>(delay = 0, amount = 0.18) {
  const ref = useRef<T>(null)
  const hasHydrated = useHasHydrated()
  const isInView = useInView(ref, { once: true, amount })
  const shouldReduceMotion = Boolean(useReducedMotion())
  const isHidden = hasHydrated && !isInView && !shouldReduceMotion

  return {
    ref,
    motionProps: {
      animate: isHidden ? { opacity: 0, y: 28 } : { opacity: 1, y: 0 },
      initial: false as const,
      transition: {
        delay,
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: "easeOut" as const,
      },
    },
  }
}

function useHasHydrated() {
  return useSyncExternalStore(subscribeHydration, getClientSnapshot, getServerSnapshot)
}

function subscribeHydration(onStoreChange: () => void) {
  const timer = window.setTimeout(onStoreChange, 0)

  return () => window.clearTimeout(timer)
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export function ScrollReveal({
  children,
  delay,
  amount = 0.18,
  ...props
}: DivRevealProps) {
  const { ref, motionProps } = useRevealMotion<HTMLDivElement>(delay, amount)

  return (
    <motion.div
      ref={ref}
      {...props}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

export function ScrollRevealSection({
  children,
  delay,
  amount = 0.16,
  ...props
}: SectionRevealProps) {
  const { ref, motionProps } = useRevealMotion<HTMLElement>(delay, amount)

  return (
    <motion.section
      ref={ref}
      {...props}
      {...motionProps}
    >
      {children}
    </motion.section>
  )
}
