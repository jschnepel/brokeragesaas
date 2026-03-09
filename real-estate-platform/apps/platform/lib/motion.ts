// Shared animation presets — import from here, not from framer-motion directly

export const spring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export const springGentle = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
};

export const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
  transition: springGentle,
};

export const slideInRight = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: 16 },
  transition: springGentle,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.96 },
  transition: spring,
};
