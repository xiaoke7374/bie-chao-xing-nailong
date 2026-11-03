import type { GameConfig } from '../config'

export class StreakSystem {
  streak = 0
  maxStreak = 0
  private readonly config: GameConfig

  constructor(config: GameConfig) {
    this.config = config
  }

  resetRun(): void {
    this.streak = 0
    this.maxStreak = 0
  }

  onDodgeSuccess(): void {
    this.streak += 1
    if (this.streak > this.maxStreak) this.maxStreak = this.streak
  }

  onCaught(): void {
    this.streak = 0
  }

  scoreMultiplier(): number {
    if (!this.config.enableStreakMultiplier) return 1
    if (this.streak < this.config.streakMultiplierThreshold) return 1
    return this.config.streakScoreMultiplier
  }
}
