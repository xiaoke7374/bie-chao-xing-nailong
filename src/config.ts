export interface GameConfig {
  safeHoldScoreRate: number
  warnHoldScoreRate: number
  spawnWarnIntervalMin: number
  spawnWarnIntervalMax: number
  warnDuration: number
  warnPeakRatio: number
  catchGraceMs: number
  catchAnimMs: number
  difficultyScoreStep: number
  intervalShrinkFactor: number
  durationShrinkFactor: number
  enableVibrate: boolean
  defaultMuted: boolean
  nearMissToastMs: number
  streakMultiplierThreshold: number
  streakScoreMultiplier: number
  enableStreakMultiplier: boolean
}

export const DEFAULT_CONFIG: GameConfig = {
  safeHoldScoreRate: 25,
  warnHoldScoreRate: 8,
  spawnWarnIntervalMin: 1800,
  spawnWarnIntervalMax: 3200,
  warnDuration: 1000,
  warnPeakRatio: 0.55,
  catchGraceMs: 180,
  catchAnimMs: 1100,
  difficultyScoreStep: 80,
  intervalShrinkFactor: 0.92,
  durationShrinkFactor: 0.96,
  enableVibrate: true,
  defaultMuted: false,
  nearMissToastMs: 650,
  streakMultiplierThreshold: 3,
  streakScoreMultiplier: 1.2,
  enableStreakMultiplier: true,
}
