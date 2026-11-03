export class AudioModule {
  private ctx: AudioContext | null = null
  private muted = false
  private unlocked = false
  private sleepNodes: { osc: OscillatorNode; gain: GainNode } | null = null
  private lastWarnAt = 0

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.sleepNodes) {
      this.sleepNodes.gain.gain.value = muted ? 0 : 0.03
    }
  }

  isMuted(): boolean {
    return this.muted
  }

  unlock(): void {
    if (this.unlocked) return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctx()
    void this.ctx.resume()
    this.unlocked = true
  }

  playSleepLoop(): void {
    if (!this.ctx || this.sleepNodes) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 90
    gain.gain.value = this.muted ? 0 : 0.03
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    this.sleepNodes = { osc, gain }
  }

  stopSleepLoop(): void {
    if (!this.sleepNodes) return
    try {
      this.sleepNodes.osc.stop()
    } catch {
      /* already stopped */
    }
    this.sleepNodes.osc.disconnect()
    this.sleepNodes.gain.disconnect()
    this.sleepNodes = null
  }

  playWarn(intensity: number): void {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    if (now - this.lastWarnAt < 0.18) return
    this.lastWarnAt = now
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 220 + intensity * 280
    gain.gain.value = 0.0001
    gain.gain.exponentialRampToValueAtTime(0.05 + intensity * 0.05, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  playCatch(): void {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.5)
  }

  playNearMiss(intense: boolean): void {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(intense ? 520 : 400, now)
    osc.frequency.exponentialRampToValueAtTime(intense ? 880 : 640, now + 0.12)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.24)
  }

  playUi(_name: 'start' | 'retry' | 'click' | 'share'): void {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)
  }
}
