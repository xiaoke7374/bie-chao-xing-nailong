export class GameSession {
  runId = '0'
  score = 0
  elapsedMs = 0
  isPlaying = false
  peakWarnSurvived = 0
  private runCounter = 0

  reset(): void {
    this.runCounter += 1
    this.runId = String(this.runCounter)
    this.score = 0
    this.elapsedMs = 0
    this.isPlaying = true
    this.peakWarnSurvived = 0
  }
}
