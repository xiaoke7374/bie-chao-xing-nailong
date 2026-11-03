import type { GameConfig } from '../config'

export class Difficulty {
  private readonly config: GameConfig

  constructor(config: GameConfig) {
    this.config = config
  }

  intervalScale(score: number): number {
    const steps = Math.floor(score / this.config.difficultyScoreStep)
    return Math.max(0.55, this.config.intervalShrinkFactor ** steps)
  }

  durationScale(score: number): number {
    const steps = Math.floor(score / this.config.difficultyScoreStep)
    return Math.max(0.65, this.config.durationShrinkFactor ** steps)
  }
}
