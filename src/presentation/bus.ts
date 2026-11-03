import type { GameEvent } from '../core/types'

type Handler = (e: GameEvent) => void

export class PresentationBus {
  private readonly listeners = new Map<GameEvent['type'], Set<Handler>>()
  private queue: GameEvent[] = []

  emit(e: GameEvent): void {
    this.queue.push(e)
  }

  on(type: GameEvent['type'], fn: Handler): () => void {
    let set = this.listeners.get(type)
    if (!set) {
      set = new Set()
      this.listeners.set(type, set)
    }
    set.add(fn)
    return () => set!.delete(fn)
  }

  flush(): void {
    if (this.queue.length === 0) return
    const batch = this.queue
    this.queue = []
    for (const e of batch) {
      const set = this.listeners.get(e.type)
      if (!set) continue
      for (const fn of set) fn(e)
    }
  }
}
