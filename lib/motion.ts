import type { Transition, Variants } from "framer-motion";

// ── Spring presets ──────────────────────────────────────────────

export const spring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

// ── Animation configs ───────────────────────────────────────────

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: spring,
};

export const slideInRight = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: spring,
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: springGentle,
};

// ── Stagger helpers ─────────────────────────────────────────────

export function staggerContainer(staggerChildren = 0.05): Variants {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren,
      },
    },
  };
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};
