import type { GameConfig } from '../config'
import type { PresentationBus } from '../presentation/bus'
import type { GameSession } from './session'
import type { ScoreSystem } from './score'
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
  private readonly config: GameConfig
  private readonly session: GameSession
  private readonly score: ScoreSystem
  private readonly warn: WarnScheduler
  private readonly bus: PresentationBus

  constructor(
    config: GameConfig,
    session: GameSession,
    score: ScoreSystem,
    warn: WarnScheduler,
    bus: PresentationBus,
  ) {
    this.config = config
    this.session = session
    this.score = score
    this.warn = warn
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
    if (input.uiAction === 'toggleMute') {
      // handled by app via storage; ignore here
    }

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
        const rate =
          this.state === 'SLEEP'
            ? this.config.safeHoldScoreRate
            : this.inWarnPeak
              ? 0
              : this.config.warnHoldScoreRate
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
        this.session.peakWarnSurvived += 1
        this.enter('SLEEP', 'WARN')
        this.warn.onEnterSleep(this.score.current)
        this.warnIntensity = 0
        this.inWarnPeak = false
        return
      }

      if (w.finished) {
        if (input.isActing && w.inPeak) {
          this.triggerCatch()
          return
        }
        this.session.peakWarnSurvived += 1
        this.enter('SLEEP', 'WARN')
        this.warn.onEnterSleep(this.score.current)
        this.warnIntensity = 0
        this.inWarnPeak = false
      }
      return
    }

    if (this.state === 'CATCH') {
      this.catchElapsed += dtMs
      if (this.catchElapsed >= this.config.catchAnimMs) {
        const high = this.score.commitHighScore()
        this.bus.emit({
          type: 'score:change',
          score: Math.floor(this.score.current),
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
    }
  }

  private beginRun(): void {
    this.session.reset()
    this.score.reset()
    this.warn.reset()
    this.warnIntensity = 0
    this.inWarnPeak = false
    this.catchElapsed = 0
    this.lastActing = false
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
