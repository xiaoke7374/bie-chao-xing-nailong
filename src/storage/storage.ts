const HIGH_KEY = 'nailong-sneak-highscore'
const MUTE_KEY = 'nailong-sneak-muted'

export interface StorageModule {
  getHighScore(): number
  setHighScore(n: number): void
  getMuted(): boolean
  setMuted(v: boolean): void
}

export class LocalStorageModule implements StorageModule {
  getHighScore(): number {
    const raw = localStorage.getItem(HIGH_KEY)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
  }

  setHighScore(n: number): void {
    localStorage.setItem(HIGH_KEY, String(Math.max(0, Math.floor(n))))
  }

  getMuted(): boolean {
    return localStorage.getItem(MUTE_KEY) === '1'
  }

  setMuted(v: boolean): void {
    localStorage.setItem(MUTE_KEY, v ? '1' : '0')
  }
}
