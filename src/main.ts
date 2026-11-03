import './style.css'
import { DEFAULT_CONFIG } from './config'
import { Difficulty } from './core/difficulty'
import { GameSession } from './core/session'
import { ScoreSystem } from './core/score'
import { StateMachine } from './core/stateMachine'
import { WarnScheduler } from './core/warnScheduler'
import { InputModule } from './input/input'
import { AudioModule } from './presentation/audio'
import { PresentationBus } from './presentation/bus'
import { RenderModule } from './presentation/render'
import { UIModule } from './presentation/ui'
import { FridgeSkin } from './skins/fridgeSkin'
import { LocalStorageModule } from './storage/storage'

const root = document.querySelector('#app')
const canvas = document.querySelector('#game')
const shell = document.querySelector('.game-shell')

if (!(root instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !(shell instanceof HTMLElement)) {
  throw new Error('Missing app root')
}

const config = { ...DEFAULT_CONFIG }
const storage = new LocalStorageModule()
const bus = new PresentationBus()
const session = new GameSession()
const score = new ScoreSystem(storage)
const difficulty = new Difficulty(config)
const warn = new WarnScheduler(config, difficulty)
const machine = new StateMachine(config, session, score, warn, bus)
const input = new InputModule()
const audio = new AudioModule()
const skin = new FridgeSkin('/assets/nailong.jpeg')
const render = new RenderModule(canvas, skin)
const ui = new UIModule(root)

const muted = storage.getMuted()
audio.setMuted(muted)
machine.setMuted(muted)

input.attach(root, document.querySelector('#actZone') as HTMLElement)
machine.startBoot()

bus.on('state:enter', (e) => {
  if (e.type !== 'state:enter') return
  if (e.state === 'SLEEP') {
    audio.playSleepLoop()
  }
  if (e.from === 'SLEEP' || e.state === 'CATCH' || e.state === 'RESULT' || e.state === 'BOOT') {
    if (e.state !== 'SLEEP') audio.stopSleepLoop()
  }
  if (e.state === 'CATCH') {
    skin.playCatch()
    audio.playCatch()
    if (config.enableVibrate && navigator.vibrate) navigator.vibrate(80)
  }
})

bus.on('warn:progress', (e) => {
  if (e.type !== 'warn:progress') return
  audio.playWarn(e.intensity)
})

bus.on('catch', () => {
  audio.stopSleepLoop()
})

function unlockAudio(): void {
  audio.unlock()
  window.removeEventListener('pointerdown', unlockAudio)
}
window.addEventListener('pointerdown', unlockAudio)

document.querySelector('#startBtn')?.addEventListener('click', () => audio.playUi('start'))
document.querySelector('#retryBtn')?.addEventListener('click', () => audio.playUi('retry'))

document.addEventListener('visibilitychange', () => {
  if (document.hidden) machine.pauseFromVisibility()
  else machine.resumeFromVisibility()
})

let last = performance.now()

function frame(now: number): void {
  const dt = Math.min(50, now - last)
  last = now

  const snapInput = input.consume()
  if (snapInput.uiAction === 'toggleMute') {
    const next = !audio.isMuted()
    audio.setMuted(next)
    storage.setMuted(next)
    machine.setMuted(next)
  }

  machine.update(dt, snapInput)
  bus.flush()

  const snapshot = machine.getSnapshot()
  ui.sync(snapshot)
  render.draw(snapshot, dt)

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
