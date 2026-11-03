import type { FaceStage } from '../core/types'
import type { SceneSkin } from './types'

export class FridgeSkin implements SceneSkin {
  readonly id = 'fridge' as const
  private face: FaceStage = 'deepSleep'
  private intensity = 0
  private acting = false
  private score = 0
  private catchFlash = 0
  private readonly img: HTMLImageElement
  private imgReady = false

  constructor(imageUrl: string) {
    this.img = new Image()
    this.img.decoding = 'async'
    this.img.onload = () => {
      this.imgReady = true
    }
    this.img.src = imageUrl
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
    // Night kitchen
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1a2b45')
    g.addColorStop(0.55, '#243a5c')
    g.addColorStop(1, '#18263c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    if (this.face === 'almostAwake' || this.face === 'lightStir') {
      ctx.fillStyle = `rgba(255, 176, 32, ${0.08 + this.intensity * 0.18})`
      ctx.fillRect(0, 0, w, h)
    }

    this.drawFridge(ctx, w, h, t)
    this.drawCharacter(ctx, w, h, t)
    this.drawLoot(ctx, w, h)

    if (this.catchFlash > 0) {
      ctx.fillStyle = `rgba(255, 77, 46, ${0.25 * this.catchFlash})`
      ctx.fillRect(0, 0, w, h)
      this.catchFlash = Math.max(0, this.catchFlash - 0.04)
    }
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

    // Interior glow
    ctx.fillStyle = 'rgba(232, 244, 248, 0.85)'
    roundRect(ctx, fx + 10, fy + 12, fw - 20, fh - 24, 8)
    ctx.fill()

    // Door swing when acting
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
      // snacks peek
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
      rot = -0.05 + Math.sin(t * 0.02) * 0.04
    } else if (this.face === 'almostAwake') {
      rot = Math.sin(t * 0.04) * 0.06
    } else if (this.face === 'caught') {
      scale = 1.35
      cx = w * 0.5 - (cw * scale) / 2
      cy = h * 0.22
      rot = 0
    }

    ctx.save()
    ctx.translate(cx + cw / 2, cy + ch / 2)
    ctx.rotate(rot)
    ctx.scale(scale, scale)
    ctx.translate(-cw / 2, -ch / 2)

    if (this.imgReady) {
      ctx.drawImage(this.img, 0, 0, cw, ch)
    } else {
      ctx.fillStyle = '#f5d03a'
      roundRect(ctx, 0, 0, cw, ch, 24)
      ctx.fill()
    }

    // Sleep eyes / stir overlay cues for single-pose asset
    if (this.face === 'deepSleep' || this.face === 'lightStir') {
      ctx.fillStyle = 'rgba(20, 35, 58, 0.55)'
      const eyeY = ch * 0.38
      ctx.fillRect(cw * 0.28, eyeY, cw * 0.16, ch * 0.035)
      ctx.fillRect(cw * 0.56, eyeY, cw * 0.16, ch * 0.035)
    }
    if (this.face === 'almostAwake') {
      ctx.strokeStyle = 'rgba(20, 35, 58, 0.8)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cw * 0.28, ch * 0.4)
      ctx.quadraticCurveTo(cw * 0.36, ch * 0.36, cw * 0.44, ch * 0.4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cw * 0.56, ch * 0.4)
      ctx.quadraticCurveTo(cw * 0.64, ch * 0.36, cw * 0.72, ch * 0.4)
      ctx.stroke()
    }

    if (this.face === 'deepSleep') {
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = `700 ${Math.floor(w * 0.07)}px Fredoka, sans-serif`
      const z = 0.5 + 0.5 * Math.sin(t * 0.003)
      ctx.fillText('z', cw * 0.78, ch * (0.12 - z * 0.04))
      ctx.globalAlpha = 0.5
      ctx.fillText('z', cw * 0.88, ch * (0.05 - z * 0.03))
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  private drawLoot(ctx: CanvasRenderingContext2D, _w: number, h: number): void {
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
