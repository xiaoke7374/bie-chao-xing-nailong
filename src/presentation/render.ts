import type { FaceStage, GameSnapshot } from '../core/types'
import type { SceneSkin } from '../skins/types'

export class RenderModule {
  private readonly canvas: HTMLCanvasElement
  private readonly skin: SceneSkin
  private readonly ctx: CanvasRenderingContext2D
  private time = 0
  private cssW = 390
  private cssH = 700

  constructor(canvas: HTMLCanvasElement, skin: SceneSkin) {
    this.canvas = canvas
    this.skin = skin
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    this.ctx = ctx
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize(): void {
    const parent = this.canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    this.cssW = Math.max(280, Math.floor(rect.width))
    this.cssH = Math.max(500, Math.floor(rect.height))
    this.canvas.style.width = `${this.cssW}px`
    this.canvas.style.height = `${this.cssH}px`
    this.canvas.width = Math.floor(this.cssW * dpr)
    this.canvas.height = Math.floor(this.cssH * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  draw(snapshot: GameSnapshot, dtMs: number): void {
    this.time += dtMs
    this.skin.setActing(snapshot.isActing)
    this.skin.onScore(snapshot.score)
    this.skin.setFace(faceFromSnapshot(snapshot), snapshot.warnIntensity)
    this.ctx.clearRect(0, 0, this.cssW, this.cssH)
    this.skin.draw(this.ctx, this.time, this.cssW, this.cssH)
  }
}

function faceFromSnapshot(s: GameSnapshot): FaceStage {
  if (s.state === 'CATCH') return 'caught'
  if (s.state === 'WARN') {
    if (s.warnIntensity < 0.35) return 'lightStir'
    return 'almostAwake'
  }
  return 'deepSleep'
}
