const device = document.getElementById('device')
const actZone = document.getElementById('actZone')
const annotText = document.getElementById('annotText')
const scoreLabel = document.getElementById('scoreLabel')
const resultScore = document.getElementById('resultScore')

const NOTES = {
  BOOT: '标题屏。角色为主视觉，点「开始」进入熟睡局。',
  SLEEP: '安全窗。按住热区偷吃加分；奶龙打呼噜。松开只是停下。',
  WARN: '微表情预警。灯光偏暖、角色微颤——应立刻松手。继续按住会进惊吓。',
  CATCH: 'Jump scare。原图大笑扑脸，分数定格。约 1 秒后可看结算。',
  RESULT: '结算。展示本局分与最高分，主按钮「再来一次」。',
}

let score = 128
let holding = false
let scoreTimer = 0

function setState(state) {
  device.dataset.state = state
  document.querySelectorAll('.state-nav button').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.state === state)
  })
  annotText.textContent = NOTES[state]
  device.classList.toggle('is-acting', false)
  holding = false

  if (state === 'CATCH') {
    window.setTimeout(() => {
      if (device.dataset.state === 'CATCH') setState('RESULT')
    }, 1100)
  }
}

document.querySelectorAll('.state-nav button').forEach((btn) => {
  btn.addEventListener('click', () => setState(btn.dataset.state))
})

document.getElementById('startBtn').addEventListener('click', () => {
  score = 0
  scoreLabel.textContent = '0'
  setState('SLEEP')
})

document.getElementById('retryBtn').addEventListener('click', () => {
  score = 0
  scoreLabel.textContent = '0'
  setState('SLEEP')
})

function canAct() {
  const s = device.dataset.state
  return s === 'SLEEP' || s === 'WARN'
}

function setHolding(on) {
  if (!canAct()) return
  holding = on
  device.classList.toggle('is-acting', on)
}

actZone.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  actZone.setPointerCapture(e.pointerId)
  setHolding(true)
})
actZone.addEventListener('pointerup', () => setHolding(false))
actZone.addEventListener('pointercancel', () => setHolding(false))
actZone.addEventListener('pointerleave', () => setHolding(false))

function tick(now) {
  if (!scoreTimer) scoreTimer = now
  const dt = Math.min(50, now - scoreTimer)
  scoreTimer = now
  if (holding && device.dataset.state === 'SLEEP') {
    score += (25 * dt) / 1000
    scoreLabel.textContent = String(Math.floor(score))
    resultScore.textContent = String(Math.floor(score))
  }
  if (holding && device.dataset.state === 'WARN') {
    // prototype: holding through warn jumps to catch quickly
    setState('CATCH')
  }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)

// Demo auto-hint: from SLEEP, after a while pulse WARN once if idle
let demoWarnAt = 0
setInterval(() => {
  if (device.dataset.state !== 'SLEEP' || holding) return
  demoWarnAt += 1
  if (demoWarnAt >= 6) {
    demoWarnAt = 0
    setState('WARN')
    window.setTimeout(() => {
      if (device.dataset.state === 'WARN' && !holding) setState('SLEEP')
    }, 1200)
  }
}, 1000)
