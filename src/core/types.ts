export type GameStateId =
  | 'BOOT'
  | 'SLEEP'
  | 'WARN'
  | 'CATCH'
  | 'RESULT'
  | 'PAUSE'

export interface InputSnapshot {
  isActing: boolean
  actJustPressed: boolean
  actJustReleased: boolean
  uiAction: null | 'start' | 'retry' | 'toggleMute'
}

export interface GameSnapshot {
  state: GameStateId
  score: number
  highScore: number
  elapsedMs: number
  isActing: boolean
  warnIntensity: number
  inWarnPeak: boolean
  muted: boolean
}

export type FaceStage = 'deepSleep' | 'lightStir' | 'almostAwake' | 'caught'

export type GameEvent =
  | { type: 'state:enter'; state: GameStateId; from: GameStateId }
  | { type: 'warn:progress'; intensity: number }
  | { type: 'score:change'; score: number; high: number }
  | { type: 'catch'; score: number }
  | { type: 'session:reset' }
