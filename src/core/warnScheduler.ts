import type { GameConfig } from '../config'
import type { Difficulty } from './difficulty'

export class WarnScheduler {
  private sleepCountdown = 0
  private warnElapsed = 0
  private activeDuration = 0
  private scoreAtSleep = 0
  private readonly config: GameConfig
  private readonly difficulty: Difficulty

  constructor(config: GameConfig, difficulty: Difficulty) {
    this.config = config
    this.difficulty = difficulty
  }

  reset(): void {
    this.sleepCountdown = 0
    this.warnElapsed = 0
    this.activeDuration = 0
    this.scoreAtSleep = 0
  }

  onEnterSleep(score: number): void {
    this.scoreAtSleep = score
    this.warnElapsed = 0
    const scale = this.difficulty.intervalScale(score)
    const min = this.config.spawnWarnIntervalMin * scale
    const max = this.config.spawnWarnIntervalMax * scale
    this.sleepCountdown = min + Math.random() * Math.max(0, max - min)
  }

  updateSleep(dtMs: number): 'idle' | 'fireWarn' {
    this.sleepCountdown -= dtMs
    if (this.sleepCountdown <= 0) return 'fireWarn'
    return 'idle'
  }

  onEnterWarn(): void {
    this.warnElapsed = 0
    const scale = this.difficulty.durationScale(this.scoreAtSleep)
    this.activeDuration = this.config.warnDuration * scale
  }

  updateWarn(dtMs: number): {
    intensity: number
    inPeak: boolean
    pastGrace: boolean
    finished: boolean
  } {
    this.warnElapsed += dtMs
    const t = Math.min(1, this.warnElapsed / Math.max(1, this.activeDuration))
    const intensity = t * t
    const inPeak = intensity >= this.config.warnPeakRatio
    const peakStartMs = this.activeDuration * Math.sqrt(this.config.warnPeakRatio)
    const pastGrace = this.warnElapsed >= peakStartMs + this.config.catchGraceMs
    const finished = this.warnElapsed >= this.activeDuration
    return { intensity, inPeak, pastGrace, finished }
  }
}
