import type { GameSnapshot, GameStateId } from '../core/types'

export class UIModule {
  private readonly hud: HTMLElement
  private readonly actZone: HTMLElement
  private readonly boot: HTMLElement
  private readonly catchOverlay: HTMLElement
  private readonly result: HTMLElement
  private readonly scoreEl: HTMLElement
  private readonly bestEl: HTMLElement
  private readonly resultScore: HTMLElement
  private readonly resultBest: HTMLElement
  private readonly muteBtn: HTMLElement
  private readonly actHint: HTMLElement
  private readonly streakHud: HTMLElement
  private readonly nearMissToast: HTMLElement
  private readonly resultStreak: HTMLElement
  private readonly newRecordBadge: HTMLElement
  private readonly multHint: HTMLElement
  private toastTimer = 0

  constructor(root: HTMLElement) {
    this.hud = must(root, '#hud')
    this.actZone = must(root, '#actZone')
    this.boot = must(root, '#bootOverlay')
    this.catchOverlay = must(root, '#catchOverlay')
    this.result = must(root, '#resultOverlay')
    this.scoreEl = must(root, '#score')
    this.bestEl = must(root, '#best')
    this.resultScore = must(root, '#resultScore')
    this.resultBest = must(root, '#resultBest')
    this.muteBtn = must(root, '#muteBtn')
    this.actHint = must(root, '#actHint')
    this.streakHud = must(root, '#streakHud')
    this.nearMissToast = must(root, '#nearMissToast')
    this.resultStreak = must(root, '#resultStreak')
    this.newRecordBadge = must(root, '#newRecordBadge')
    this.multHint = must(root, '#multHint')
  }

  sync(snapshot: GameSnapshot): void {
    this.scoreEl.textContent = String(snapshot.score)
    this.bestEl.textContent = String(snapshot.highScore)
    this.resultScore.textContent = String(snapshot.score)
    this.resultBest.textContent = String(snapshot.highScore)
    this.resultStreak.textContent = String(snapshot.maxStreak)
    this.newRecordBadge.hidden = !snapshot.isNewRecord
    this.muteBtn.textContent = snapshot.muted ? '🔇' : '♪'
    this.muteBtn.setAttribute('aria-label', snapshot.muted ? '取消静音' : '静音')
    this.actZone.classList.toggle('is-holding', snapshot.isActing)
    this.actHint.textContent = snapshot.state === 'WARN' ? '快松手！' : '按住偷吃'

    if (snapshot.streak >= 1) {
      this.streakHud.hidden = false
      this.streakHud.textContent = `连躲 ×${snapshot.streak}`
    } else {
      this.streakHud.hidden = true
    }

    if (snapshot.scoreMultiplier > 1 && snapshot.state === 'SLEEP') {
      this.multHint.hidden = false
      this.multHint.textContent = `×${snapshot.scoreMultiplier}`
    } else {
      this.multHint.hidden = true
    }

    this.showForState(snapshot.state)
  }

  showNearMiss(text: string, durationMs: number): void {
    this.nearMissToast.textContent = text
    this.nearMissToast.hidden = false
    this.nearMissToast.classList.remove('is-on')
    // reflow to restart animation
    void this.nearMissToast.offsetWidth
    this.nearMissToast.classList.add('is-on')
    window.clearTimeout(this.toastTimer)
    this.toastTimer = window.setTimeout(() => {
      this.nearMissToast.classList.remove('is-on')
      this.nearMissToast.hidden = true
    }, durationMs)
  }

  private showForState(state: GameStateId): void {
    const playing = state === 'SLEEP' || state === 'WARN' || state === 'PAUSE'
    this.hud.hidden = !(playing || state === 'CATCH')
    this.actZone.hidden = !playing
    this.boot.hidden = state !== 'BOOT'
    this.catchOverlay.hidden = state !== 'CATCH'
    this.result.hidden = state !== 'RESULT'
    if (state === 'RESULT' || state === 'BOOT' || state === 'CATCH') {
      this.streakHud.hidden = true
      this.multHint.hidden = true
    }
  }
}

function must(root: HTMLElement, sel: string): HTMLElement {
  const el = root.querySelector(sel)
  if (!(el instanceof HTMLElement)) throw new Error(`Missing ${sel}`)
  return el
}
