export interface ShareCardInput {
  score: number
  highScore: number
  maxStreak: number
  isNewRecord: boolean
  characterUrl: string
}

export class ShareCard {
  async render(input: ShareCardInput): Promise<Blob> {
    const w = 720
    const h = 1280
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas unavailable')

    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1a2b45')
    g.addColorStop(1, '#14233a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#fff6de'
    ctx.font = '700 54px Fredoka, Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('别吵醒奶龙', w / 2, 140)

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '500 28px Noto Sans SC, sans-serif'
    ctx.fillText('本局得分', w / 2, 240)

    ctx.fillStyle = '#f5d03a'
    ctx.font = '700 160px Fredoka, sans-serif'
    ctx.fillText(String(input.score), w / 2, 400)

    if (input.isNewRecord) {
      roundBadge(ctx, w / 2 - 90, 430, 180, 48, '#f5d03a')
      ctx.fillStyle = '#0e1726'
      ctx.font = '700 28px Noto Sans SC, sans-serif'
      ctx.fillText('新纪录', w / 2, 464)
    }

    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '500 32px Noto Sans SC, sans-serif'
    ctx.fillText(`最高 ${input.highScore}`, w / 2, 560)
    ctx.fillText(`最高连躲 ${input.maxStreak}`, w / 2, 620)

    const img = await loadImage(input.characterUrl)
    const size = 360
    ctx.drawImage(img, (w - size) / 2, 720, size, size)

    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '400 22px Noto Sans SC, sans-serif'
    ctx.fillText('网页小游戏 · 点开即玩', w / 2, 1220)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    )
    if (!blob) throw new Error('导出失败')
    return blob
  }

  async shareOrDownload(blob: Blob, filename: string): Promise<void> {
    const file = new File([blob], filename, { type: 'image/png' })
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>
      canShare?: (data: ShareData) => boolean
    }
    try {
      if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await nav.share({
          files: [file],
          title: '别吵醒奶龙',
          text: '我差点被奶龙抓到！',
        })
        return
      }
    } catch {
      // fall through to download
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })
}

function roundBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  const r = h / 2
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}
