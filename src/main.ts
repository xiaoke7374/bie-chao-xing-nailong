import './style.css'
import { DEFAULT_CONFIG } from './config'
import { Difficulty } from './core/difficulty'
import { GameSession } from './core/session'
import { ScoreSystem } from './core/score'
import { StateMachine } from './core/stateMachine'
import { StreakSystem } from './core/streak'
import { WarnScheduler } from './core/warnScheduler'
import { InputModule } from './input/input'
import { AudioModule } from './presentation/audio'
import { PresentationBus } from './presentation/bus'
import { RenderModule } from './presentation/render'
import { ShareCard } from './presentation/shareCard'
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
const streak = new StreakSystem(config)
const machine = new StateMachine(config, session, score, warn, streak, bus)
const input = new InputModule()
const audio = new AudioModule()
const skin = new FridgeSkin()
const render = new RenderModule(canvas, skin)
const ui = new UIModule(root)
const shareCard = new ShareCard()

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

bus.on('dodge:success', (e) => {
  if (e.type !== 'dodge:success') return
  const intense = e.intensity >= config.warnPeakRatio
  const text = intense ? '太险了！' : '好险！'
  ui.showNearMiss(text, config.nearMissToastMs)
  audio.playNearMiss(intense)
  if (config.enableVibrate && navigator.vibrate) navigator.vibrate(intense ? [30, 40, 30] : 25)
  shell.classList.remove('flash-near-miss')
  void shell.offsetWidth
  shell.classList.add('flash-near-miss')
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

let sharing = false

async function handleShare(): Promise<void> {
  if (sharing) return
  const snap = machine.getSnapshot()
  if (snap.state !== 'RESULT') return
  sharing = true
  audio.playUi('share')
  try {
    const blob = await shareCard.render({
      score: snap.score,
      highScore: snap.highScore,
      maxStreak: snap.maxStreak,
      isNewRecord: snap.isNewRecord,
      characterUrl: '/assets/nailong-sleep.jpg',
    })
    await shareCard.shareOrDownload(blob, `nailong-score-${snap.score}.png`)
  } catch (err) {
    console.error(err)
  } finally {
    sharing = false
  }
}

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
  if (snapInput.uiAction === 'share') {
    void handleShare()
  }

  machine.update(dt, snapInput)
  bus.flush()

  const snapshot = machine.getSnapshot()
  ui.sync(snapshot)
  render.draw(snapshot, dt)

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
