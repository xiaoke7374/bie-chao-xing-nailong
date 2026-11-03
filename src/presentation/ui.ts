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
  }

  sync(snapshot: GameSnapshot): void {
    this.scoreEl.textContent = String(snapshot.score)
    this.bestEl.textContent = String(snapshot.highScore)
    this.resultScore.textContent = String(snapshot.score)
    this.resultBest.textContent = String(snapshot.highScore)
    this.muteBtn.textContent = snapshot.muted ? '🔇' : '♪'
    this.muteBtn.setAttribute('aria-label', snapshot.muted ? '取消静音' : '静音')
    this.actZone.classList.toggle('is-holding', snapshot.isActing)
    this.actHint.textContent = snapshot.state === 'WARN' ? '快松手！' : '按住偷吃'

    this.showForState(snapshot.state)
  }

  private showForState(state: GameStateId): void {
    const playing = state === 'SLEEP' || state === 'WARN' || state === 'PAUSE'
    this.hud.hidden = !(playing || state === 'CATCH')
    this.actZone.hidden = !playing
    this.boot.hidden = state !== 'BOOT'
    this.catchOverlay.hidden = state !== 'CATCH'
    this.result.hidden = state !== 'RESULT'
  }
}

function must(root: HTMLElement, sel: string): HTMLElement {
  const el = root.querySelector(sel)
  if (!(el instanceof HTMLElement)) throw new Error(`Missing ${sel}`)
  return el
}
