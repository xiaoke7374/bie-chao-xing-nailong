import type { InputSnapshot } from '../core/types'

export class InputModule {
  private acting = false
  private prevActing = false
  private uiAction: InputSnapshot['uiAction'] = null

  attach(root: HTMLElement, actZone: HTMLElement): void {
    const onDown = (e: Event) => {
      e.preventDefault()
      this.acting = true
    }
    const onUp = () => {
      this.acting = false
    }

    actZone.addEventListener('pointerdown', onDown)
    actZone.addEventListener('pointerup', onUp)
    actZone.addEventListener('pointercancel', onUp)
    actZone.addEventListener('pointerleave', onUp)
    window.addEventListener('pointerup', onUp)

    root.querySelector('#startBtn')?.addEventListener('click', () => {
      this.uiAction = 'start'
    })
    root.querySelector('#retryBtn')?.addEventListener('click', () => {
      this.uiAction = 'retry'
    })
    root.querySelector('#muteBtn')?.addEventListener('click', () => {
      this.uiAction = 'toggleMute'
    })
  }

  consume(): InputSnapshot {
    const snap: InputSnapshot = {
      isActing: this.acting,
      actJustPressed: this.acting && !this.prevActing,
      actJustReleased: !this.acting && this.prevActing,
      uiAction: this.uiAction,
    }
    this.prevActing = this.acting
    this.uiAction = null
    return snap
  }
}
