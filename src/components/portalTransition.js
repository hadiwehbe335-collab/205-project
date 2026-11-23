import { portalActivations, startPortalSound } from './startupSound'
import { readTransitionSound } from './transitionSoundPreference'

const ink = '#1B1F3B'
const sky = '#5BB8FF'
const sunny = '#FFD84D'
const ocean = '#7CC6FF'
const tau = Math.PI * 2
const clamp = n => Math.max(0, Math.min(1, n))
const ease = n => n * n * (3 - 2 * n)
const noise = n => {
  const value = Math.sin(n * 127.1 + 78.233) * 43758.5453
  return value - Math.floor(value)
}
const disc = (ctx, x, y, radius) => {
  ctx.beginPath()
  ctx.arc(x, y, Math.max(0, radius), 0, tau)
}

export const portalTiming = Object.freeze({ cover: 420, reveal: 400 })

// Progress is 0–1 for formation and 1–2 for the destination reveal.
export function paintPortal(ctx, width, height, x, y, progress) {
  ctx.clearRect(0, 0, width, height)
  if (progress <= 0 || progress >= 2) return
  const arrival = progress > 1
  const t = arrival ? progress - 1 : progress
  const extent = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 30
  const radius = 4 + extent * (arrival ? ease(t) * 1.15 : ease(t))
  const outer = arrival ? extent + 6 : radius
  const unit = Math.max(0.72, Math.min(width, height) / 760)
  const fade = arrival ? 1 - ease(t) : 1

  ctx.save()
  ctx.globalAlpha = fade
  disc(ctx, x, y, outer)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = ink
  ctx.fillRect(0, 0, width, height)

  // The off-axis fields move across one another as the aperture grows.
  const turn = progress * 2.7
  for (const [angle, offset, size, color] of [
    [0, 0.53, 0.88, sky], [2.0, 0.47, 0.81, ocean],
    [3.7, 0.62, 0.50, sunny], [5.2, 0.64, 0.65, '#9C8CFF']
  ]) {
    const cx = x + Math.cos(turn + angle) * outer * offset
    const cy = y + Math.sin(turn + angle) * outer * offset
    const field = ctx.createRadialGradient(cx, cy, 0, cx, cy, outer * size)
    field.addColorStop(0, color)
    field.addColorStop(1, color + '00')
    ctx.fillStyle = field
    ctx.fillRect(0, 0, width, height)
  }

  ctx.translate(x, y)
  ctx.rotate(turn * 0.58)
  for (let i = 0; i < 13; i++) {
    const spiralRadius = outer * (0.16 + i * 0.071)
    ctx.beginPath()
    ctx.ellipse(0, 0, spiralRadius, spiralRadius * 0.69, i * 0.17, i * 0.67, i * 0.67 + 2.6)
    ctx.strokeStyle = i % 4 === 0 ? '#FFD84D90' : '#E9F8FF55'
    ctx.lineWidth = (i % 3 === 0 ? 2.2 : 0.85) * unit
    ctx.stroke()
  }
  ctx.restore()

  if (arrival) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1
    disc(ctx, x, y, radius)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  // Ink silhouette, luminous inner lip, and short orbiting bands.
  ctx.globalAlpha = fade * clamp(t * 11 + (arrival ? 1 : 0))
  for (const [offset, color, widthFactor] of [
    [0, ink, 11], [-3, sky, 5], [-7, '#F1FAFF', 1.6], [10, '#7CC6FF65', 1.6]
  ]) {
    disc(ctx, x, y, radius + offset * unit)
    ctx.strokeStyle = color
    ctx.lineWidth = widthFactor * unit
    ctx.stroke()
  }
  ctx.lineCap = 'round'
  for (let i = 0; i < 7; i++) {
    const angle = turn * 1.6 + i * tau / 7
    ctx.beginPath()
    ctx.arc(x, y, radius + (13 + i % 3 * 7) * unit, angle, angle + 0.16 + noise(i) * 0.65)
    ctx.strokeStyle = i % 3 === 0 ? sunny : ocean
    ctx.lineWidth = (i % 3 === 0 ? 3 : 1.5) * unit
    ctx.stroke()
  }

  if (!arrival) {
    const ripple = 8 + extent * ease(clamp(t * 1.5))
    ctx.globalAlpha = (1 - clamp(t * 1.5)) * 0.8
    disc(ctx, x, y, ripple)
    ctx.strokeStyle = sunny
    ctx.lineWidth = 2 * unit
    ctx.stroke()
  }

  for (let i = 0; i < 62; i++) {
    const angle = noise(i + 11) * tau + turn * 0.16
    const distance = radius * (0.54 + noise(i + 92) * 0.47) + 70 * unit * noise(i + 310)
    const px = x + Math.cos(angle) * distance
    const py = y + Math.sin(angle) * distance
    const size = (1.2 + noise(i + 194) * 3.8) * unit
    ctx.globalAlpha = fade * clamp(progress * 6) * (0.3 + 0.7 * noise(i + 351))
    ctx.fillStyle = [sunny, '#F3F9FF', ocean][i % 3]
    if (i % 5 === 0) {
      ctx.beginPath()
      for (let j = 0; j < 8; j++) {
        const a = j * tau / 8
        const r = j % 2 ? size * 0.48 : size * 2.2
        ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r)
      }
      ctx.closePath()
    } else disc(ctx, px, py, size * 0.52)
    ctx.fill()
  }
  ctx.restore()
}

export function portalLink(event, link) {
  if (!link?.hasAttribute('href') || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.hasAttribute('download') || link.hasAttribute('data-no-portal') ||
      link.relList.contains('external')) return null
  const target = link.target || document.querySelector('base[target]')?.target || '_self'
  if (target.toLowerCase() !== '_self') return null
  const url = new URL(link.href, location.href)
  if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) return null
  if (url.pathname === location.pathname && url.search === location.search) return null
  return url
}

// Call from an existing router link handler after eligibility checks and preventDefault.
export function createPortalTransition({ maxHold = 180, getRevealElements = () => [] } = {}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '2147483647'
  })
  const ctx = canvas.getContext('2d')
  let active
  let disposed = false
  let entrances = []

  const cancel = () => {
    active?.controller.abort()
    active?.sound?.close()
    canvas.remove()
    entrances.forEach(animation => animation.cancel())
    entrances = []
  }
  const onPreference = () => { if (motion.matches) cancel() }
  addEventListener('popstate', cancel)
  motion.addEventListener('change', onPreference)

  async function navigate(event, link, commit) {
    if (disposed || motion.matches || !ctx || document.hidden) return commit()
    portalActivations.add(event.nativeEvent ?? event)
    cancel()
    const controller = new AbortController()
    const { signal } = controller
    const run = { controller, sound: readTransitionSound() ? startPortalSound() : null }
    active = run
    const rect = link.getBoundingClientRect()
    const fromKeyboard = event.detail === 0
    const xFraction = clamp((fromKeyboard ? rect.left + rect.width / 2 : event.clientX) / innerWidth)
    const yFraction = clamp((fromKeyboard ? rect.top + rect.height / 2 : event.clientY) / innerHeight)

    function draw(progress) {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(2304000 / (width * height)))
      const w = Math.round(width * ratio)
      const h = Math.round(height * ratio)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      paintPortal(ctx, width, height, width * xFraction, height * yFraction, progress)
    }

    function phase(duration, start) {
      return new Promise(resolve => {
        if (signal.aborted) return resolve(false)
        const started = performance.now()
        let frame
        const finish = completed => {
          cancelAnimationFrame(frame)
          clearTimeout(timer)
          signal.removeEventListener('abort', abort)
          resolve(completed)
        }
        const abort = () => finish(false)
        const tick = now => {
          const p = clamp((now - started) / duration)
          draw(start + (start === 0 ? Math.max(0.045, p) : p))
          if (p < 1) frame = requestAnimationFrame(tick)
          else finish(true)
        }
        // Keep navigation live even if the browser throttles animation frames.
        const timer = setTimeout(() => finish(true), duration + 48)
        signal.addEventListener('abort', abort, { once: true })
        frame = requestAnimationFrame(tick)
      })
    }

    document.body.append(canvas)
    try {
      draw(0.045)
      const covered = await phase(portalTiming.cover, 0)
      if (!covered) {
        if (active === run && motion.matches && !disposed) return commit()
        return
      }
      draw(1)
      const committed = Promise.resolve(commit())
      let timer
      let ready = false
      const earlyCommit = committed.then(() => { ready = true })
      try {
        await Promise.race([earlyCommit, new Promise(resolve => { timer = setTimeout(resolve, maxHold) })])
      } finally {
        clearTimeout(timer)
      }
      if (ready && !signal.aborted && !motion.matches) {
        entrances = Array.from(getRevealElements()).slice(0, 6)
          .filter(element => typeof element.animate === 'function')
          .map((element, index) => element.animate([
            { opacity: 0.35, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 260, delay: index * 24, easing: 'ease-out', fill: 'backwards' }))
      }
      if (!signal.aborted) run.sound?.reveal()
      await phase(portalTiming.reveal, 1)
      return await committed
    } finally {
      run.sound?.close()
      if (active === run) {
        canvas.remove()
        active = undefined
      }
    }
  }

  return {
    navigate,
    cancel,
    destroy() {
      disposed = true
      cancel()
      canvas.remove()
      removeEventListener('popstate', cancel)
      motion.removeEventListener('change', onPreference)
    }
  }
}
