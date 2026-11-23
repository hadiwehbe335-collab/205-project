import { useEffect, useId, useRef } from 'react'

// Coordinates use the same 174 × 212 space as the official "whoa" artwork.
export default function OllieGaze() {
  const layer = useRef(null)
  const leftEye = useId()

  useEffect(() => {
    const artwork = layer.current
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let point

    function reset() {
      cancelAnimationFrame(frame)
      frame = 0
      artwork.removeAttribute('data-tracking')
      artwork.style.removeProperty('--gaze-x')
      artwork.style.removeProperty('--gaze-y')
    }

    function track(event) {
      if (motion.matches || event.pointerType === 'touch' ||
          event.target?.closest?.('.startup-dialog')) {
        reset()
        return
      }
      point = { x: event.clientX, y: event.clientY }
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const bounds = artwork.getBoundingClientRect()
        const scale = Math.min(bounds.width / 174, bounds.height / 212)
        const x = point.x - bounds.left - bounds.width / 2
        const y = point.y - bounds.top - bounds.height / 2 - 16 * scale
        const distance = Math.max(110, Math.hypot(x, y))
        artwork.style.setProperty('--gaze-x', `${7 * x / distance}px`)
        artwork.style.setProperty('--gaze-y', `${6 * y / distance}px`)
        artwork.setAttribute('data-tracking', '')
      })
    }

    addEventListener('pointermove', track, { passive: true })
    addEventListener('pointercancel', reset)
    addEventListener('blur', reset)
    document.documentElement.addEventListener('pointerleave', reset)
    motion.addEventListener('change', reset)
    return () => {
      reset()
      removeEventListener('pointermove', track)
      removeEventListener('pointercancel', reset)
      removeEventListener('blur', reset)
      document.documentElement.removeEventListener('pointerleave', reset)
      motion.removeEventListener('change', reset)
    }
  }, [])

  return (
    <svg ref={layer} className="ollie-gaze" viewBox="0 0 174 212" focusable="false">
      <defs><clipPath id={leftEye}><circle cx="63" cy="123" r="13" /></clipPath></defs>
      <circle cx="63" cy="123" r="13" fill="#7bc6ff" />
      <path d="M48 109H77C76 120 64 124 48 121Z" fill="#7bd88f" clipPath={`url(#${leftEye})`} />
      <circle cx="111" cy="123" r="13" fill="#7bc6ff" />
      <g className="ollie-gaze-pupils">
        <circle cx="63" cy="123" r="11.5" fill="#1b1f3b" />
        <circle cx="111" cy="123" r="11.5" fill="#1b1f3b" />
        <g className="ollie-gaze-highlights" fill="#fffafc">
          <circle cx="67" cy="118" r="3.1" />
          <circle cx="115" cy="118" r="3.1" />
        </g>
      </g>
    </svg>
  )
}
