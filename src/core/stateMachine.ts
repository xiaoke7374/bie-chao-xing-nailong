import type { GameConfig } from '../config'
import type { PresentationBus } from '../presentation/bus'
import type { GameSession } from './session'
import type { ScoreSystem } from './score'
import type { StreakSystem } from './streak'
import type { WarnScheduler } from './warnScheduler'
import type { GameSnapshot, GameStateId, InputSnapshot } from './types'

export class StateMachine {
  private state: GameStateId = 'BOOT'
  private resumeState: GameStateId = 'SLEEP'
  private warnIntensity = 0
  private inWarnPeak = false
  private catchElapsed = 0
  private muted = false
  private lastActing = false
  private isNewRecord = false
  private highBeforeCommit = 0
  private readonly config: GameConfig
  private readonly session: GameSession
  private readonly score: ScoreSystem
  private readonly warn: WarnScheduler
  private readonly streak: StreakSystem
  private readonly bus: PresentationBus

  constructor(
    config: GameConfig,
    session: GameSession,
    score: ScoreSystem,
    warn: WarnScheduler,
    streak: StreakSystem,
    bus: PresentationBus,
  ) {
    this.config = config
    this.session = session
    this.score = score
    this.warn = warn
    this.streak = streak
    this.bus = bus
  }

  get current(): GameStateId {
    return this.state
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  startBoot(): void {
    this.enter('BOOT', 'BOOT')
  }

  update(dtMs: number, input: InputSnapshot): void {
    if (this.state === 'BOOT' && input.uiAction === 'start') {
      this.beginRun()
      return
    }

    if (this.state === 'RESULT' && input.uiAction === 'retry') {
      this.beginRun()
      return
    }

    if (this.state === 'PAUSE') return

    if (this.state === 'SLEEP' || this.state === 'WARN') {
      this.session.elapsedMs += dtMs
      this.lastActing = input.isActing

      if (input.isActing) {
        let rate =
          this.state === 'SLEEP'
            ? this.config.safeHoldScoreRate
            : this.inWarnPeak
              ? 0
              : this.config.warnHoldScoreRate
        if (this.state === 'SLEEP') {
          rate *= this.streak.scoreMultiplier()
        }
        if (rate > 0) {
          this.score.add((rate * dtMs) / 1000)
          this.session.score = this.score.current
          this.bus.emit({
            type: 'score:change',
            score: Math.floor(this.score.current),
            high: this.score.loadHighScore(),
          })
        }
      }
    }

    if (this.state === 'SLEEP') {
      if (this.warn.updateSleep(dtMs) === 'fireWarn') {
        this.enter('WARN', 'SLEEP')
        this.warn.onEnterWarn()
      }
      return
    }

    if (this.state === 'WARN') {
      const w = this.warn.updateWarn(dtMs)
      this.warnIntensity = w.intensity
      this.inWarnPeak = w.inPeak
      this.bus.emit({ type: 'warn:progress', intensity: w.intensity })

      if (w.inPeak && w.pastGrace && input.isActing) {
        this.triggerCatch()
        return
      }

      if (input.actJustReleased && !w.inPeak) {
        this.surviveWarn(w.intensity)
        return
      }

      // Released during peak but still within grace window → survive when warn ends
      if (input.actJustReleased && w.inPeak && !w.pastGrace) {
        // stay in WARN until finished; not acting so will survive
        return
      }

      if (w.finished) {
        if (input.isActing && w.inPeak) {
          this.triggerCatch()
          return
        }
        this.surviveWarn(w.intensity)
      }
      return
    }

    if (this.state === 'CATCH') {
      this.catchElapsed += dtMs
      if (this.catchElapsed >= this.config.catchAnimMs) {
        this.highBeforeCommit = this.score.loadHighScore()
        const floorScore = Math.floor(this.score.current)
        this.isNewRecord = floorScore > this.highBeforeCommit
        const high = this.score.commitHighScore()
        this.bus.emit({
          type: 'score:change',
          score: floorScore,
          high,
        })
        this.enter('RESULT', 'CATCH')
      }
    }
  }

  pauseFromVisibility(): void {
    if (this.state === 'BOOT' || this.state === 'RESULT' || this.state === 'CATCH') return
    if (this.state === 'PAUSE') return
    this.resumeState = this.state
    this.enter('PAUSE', this.state)
  }

  resumeFromVisibility(): void {
    if (this.state !== 'PAUSE') return
    this.enter(this.resumeState, 'PAUSE')
  }

  getSnapshot(): GameSnapshot {
    return {
      state: this.state,
      score: Math.floor(this.score.current),
      highScore: this.score.loadHighScore(),
      elapsedMs: this.session.elapsedMs,
      isActing: this.lastActing && (this.state === 'SLEEP' || this.state === 'WARN'),
      warnIntensity: this.state === 'WARN' ? this.warnIntensity : 0,
      inWarnPeak: this.state === 'WARN' && this.inWarnPeak,
      muted: this.muted,
      streak: this.streak.streak,
      maxStreak: this.streak.maxStreak,
      isNewRecord: this.state === 'RESULT' && this.isNewRecord,
      scoreMultiplier: this.streak.scoreMultiplier(),
    }
  }

  private surviveWarn(intensity: number): void {
    this.session.peakWarnSurvived += 1
    this.streak.onDodgeSuccess()
    this.bus.emit({
      type: 'dodge:success',
      intensity,
      streak: this.streak.streak,
    })
    this.enter('SLEEP', 'WARN')
    this.warn.onEnterSleep(this.score.current)
    this.warnIntensity = 0
    this.inWarnPeak = false
  }

  private beginRun(): void {
    this.session.reset()
    this.score.reset()
    this.warn.reset()
    this.streak.resetRun()
    this.warnIntensity = 0
    this.inWarnPeak = false
    this.catchElapsed = 0
    this.lastActing = false
    this.isNewRecord = false
    this.bus.emit({ type: 'session:reset' })
    this.enter('SLEEP', this.state)
    this.warn.onEnterSleep(0)
    this.bus.emit({
      type: 'score:change',
      score: 0,
      high: this.score.loadHighScore(),
    })
  }

  private triggerCatch(): void {
    this.catchElapsed = 0
    this.streak.onCaught()
    this.bus.emit({ type: 'catch', score: Math.floor(this.score.current) })
    this.enter('CATCH', this.state)
    this.warnIntensity = 1
    this.inWarnPeak = true
  }

  private enter(next: GameStateId, from: GameStateId): void {
    this.state = next
    this.bus.emit({ type: 'state:enter', state: next, from })
  }
}
