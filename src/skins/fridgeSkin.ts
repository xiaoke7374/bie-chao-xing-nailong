import { assetUrl } from '../assets'
import type { FaceStage } from '../core/types'
import type { SceneSkin } from './types'

type FaceKey = 'sleep' | 'discover' | 'scare'

const FACE_URLS: Record<FaceKey, string> = {
  sleep: assetUrl('assets/nailong-sleep.jpg'),
  discover: assetUrl('assets/nailong-discover.jpg'),
  scare: assetUrl('assets/nailong-scare.jpg'),
}

export class FridgeSkin implements SceneSkin {
  readonly id = 'fridge' as const
  private face: FaceStage = 'deepSleep'
  private intensity = 0
  private acting = false
  private score = 0
  private catchFlash = 0
  private readonly images = new Map<FaceKey, HTMLImageElement>()
  private ready = new Set<FaceKey>()

  constructor(_fallbackUrl?: string) {
    for (const [key, url] of Object.entries(FACE_URLS) as [FaceKey, string][]) {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        this.ready.add(key)
      }
      img.src = url
      this.images.set(key, img)
    }
  }

  setFace(stage: FaceStage, intensity: number): void {
    this.face = stage
    this.intensity = intensity
  }

  setActing(acting: boolean): void {
    this.acting = acting
  }

  onScore(score: number): void {
    this.score = score
  }

  playCatch(): void {
    this.catchFlash = 1
  }

  draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number): void {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1a2b45')
    g.addColorStop(0.55, '#243a5c')
    g.addColorStop(1, '#18263c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    if (this.face === 'almostAwake' || this.face === 'lightStir') {
      ctx.fillStyle = `rgba(255, 176, 32, ${0.08 + this.intensity * 0.22})`
      ctx.fillRect(0, 0, w, h)
    }

    // During full catch, canvas stays dim behind DOM scare overlay
    if (this.face !== 'caught') {
      this.drawFridge(ctx, w, h, t)
      this.drawCharacter(ctx, w, h, t)
      this.drawLoot(ctx, h)
    } else {
      this.drawScareCanvas(ctx, w, h, t)
    }

    if (this.catchFlash > 0) {
      ctx.fillStyle = `rgba(255, 77, 46, ${0.28 * this.catchFlash})`
      ctx.fillRect(0, 0, w, h)
      this.catchFlash = Math.max(0, this.catchFlash - 0.04)
    }
  }

  private faceKey(): FaceKey {
    if (this.face === 'caught') return 'scare'
    if (this.face === 'almostAwake' || this.face === 'lightStir') return 'discover'
    return 'sleep'
  }

  private currentImage(): HTMLImageElement | null {
    const key = this.faceKey()
    if (!this.ready.has(key)) {
      // fallback chain
      if (this.ready.has('sleep')) return this.images.get('sleep') ?? null
      return null
    }
    return this.images.get(key) ?? null
  }

  private drawFridge(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
  ): void {
    const fw = w * 0.42
    const fh = h * 0.46
    const fx = w * 0.52
    const fy = h * 0.18

    ctx.save()
    ctx.fillStyle = '#9ec4d6'
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 3
    roundRect(ctx, fx, fy, fw, fh, 14)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = 'rgba(232, 244, 248, 0.85)'
    roundRect(ctx, fx + 10, fy + 12, fw - 20, fh - 24, 8)
    ctx.fill()

    const open = this.acting ? -0.55 : -0.08 + Math.sin(t * 0.001) * 0.01
    ctx.save()
    ctx.translate(fx, fy)
    ctx.transform(Math.cos(open), 0, 0, 1, 0, 0)
    ctx.fillStyle = '#7fa9bd'
    roundRect(ctx, 0, 0, fw, fh, 14)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(fw * 0.78, fh * 0.35, 6, fh * 0.22)
    ctx.restore()

    if (this.acting) {
      ctx.fillStyle = '#ff7a59'
      ctx.beginPath()
      ctx.arc(fx + fw * 0.35, fy + fh * 0.4, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffe36b'
      ctx.beginPath()
      ctx.arc(fx + fw * 0.5, fy + fh * 0.55, 9, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawCharacter(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
  ): void {
    const img = this.currentImage()
    const cw = w * 0.62
    const ch = cw
    let cx = w * 0.08
    let cy = h * 0.32
    let rot = -0.08
    let scale = 1

    if (this.face === 'deepSleep') {
      cy += 10
      rot = -0.12 + Math.sin(t * 0.002) * 0.02
    } else if (this.face === 'lightStir') {
      rot = -0.04 + Math.sin(t * 0.02) * 0.05
      scale = 1.02
    } else if (this.face === 'almostAwake') {
      rot = Math.sin(t * 0.045) * 0.07
      scale = 1.06 + this.intensity * 0.04
      cy -= 6
    }

    ctx.save()
    ctx.translate(cx + cw / 2, cy + ch / 2)
    ctx.rotate(rot)
    ctx.scale(scale, scale)
    ctx.translate(-cw / 2, -ch / 2)

    if (img) {
      ctx.drawImage(img, 0, 0, cw, ch)
    } else {
      ctx.fillStyle = '#f5d03a'
      roundRect(ctx, 0, 0, cw, ch, 24)
      ctx.fill()
    }

    if (this.face === 'deepSleep') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = `700 ${Math.floor(w * 0.07)}px Fredoka, sans-serif`
      const z = 0.5 + 0.5 * Math.sin(t * 0.003)
      ctx.fillText('z', cw * 0.78, ch * (0.12 - z * 0.04))
      ctx.globalAlpha = 0.5
      ctx.fillText('z', cw * 0.88, ch * (0.05 - z * 0.03))
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  private drawScareCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
  ): void {
    const img = this.images.get('scare')
    const pulse = 1.08 + Math.sin(t * 0.04) * 0.03
    const size = Math.max(w, h) * 0.95 * pulse
    const x = (w - size) / 2
    const y = (h - size) * 0.35

    ctx.fillStyle = '#1a1020'
    ctx.fillRect(0, 0, w, h)

    if (img && this.ready.has('scare')) {
      ctx.drawImage(img, x, y - h * 0.05, size, size)
    }
  }

  private drawLoot(ctx: CanvasRenderingContext2D, h: number): void {
    const n = Math.min(8, Math.floor(this.score / 40))
    for (let i = 0; i < n; i++) {
      const x = 18 + (i % 4) * 28
      const y = h - 120 - Math.floor(i / 4) * 26
      ctx.fillStyle = i % 2 === 0 ? '#ff7a59' : '#8adf7a'
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
