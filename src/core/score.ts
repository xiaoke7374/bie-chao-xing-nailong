import type { StorageModule } from '../storage/storage'

export class ScoreSystem {
  private value = 0
  private readonly storage: StorageModule

  constructor(storage: StorageModule) {
    this.storage = storage
  }

  get current(): number {
    return this.value
  }

  reset(): void {
    this.value = 0
  }

  add(points: number): void {
    if (points <= 0) return
    this.value += points
  }

  loadHighScore(): number {
    return this.storage.getHighScore()
  }

  commitHighScore(): number {
    const high = Math.max(this.storage.getHighScore(), Math.floor(this.value))
    this.storage.setHighScore(high)
    return high
  }
}
