export const MOTION_DURATION = {
  instant: 0.09,
  fast: 0.18,
  standard: 0.32,
  cinematic: 0.52,
  exit: 0.22,
} as const;

export const MOTION_EASE = {
  apple: [0.16, 1, 0.3, 1] as const,
  spring: [0.22, 1.24, 0.36, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
} as const;

export const MOTION_DISTANCE = {
  subtle: 8,
  standard: 16,
  cinematic: 28,
} as const;

export const MOTION_SCALE = {
  pressed: 0.985,
  hover: 1.015,
  enter: 0.985,
} as const;

export const MOTION_STAGGER = 0.048;
