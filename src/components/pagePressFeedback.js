import { createPagePressSound, portalActivations } from './startupSound'
import { readTransitionSound } from './transitionSoundPreference'

export function listenForPagePresses() {
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let player

  function onClick(event) {
    if (event.button !== 0 || motion.matches || !readTransitionSound() ||
        portalActivations.has(event) || document.querySelector('.startup-dialog[open]')) return

    const path = event.composedPath()
    const button = path.find(node => node instanceof Element && node.matches('button, [role="button"], input[type="button"], input[type="submit"]'))
    if (!path.some(node => node instanceof Element && node.id === 'root') ||
        !button || button.matches(':disabled, [aria-disabled="true"]') || button.closest('.startup-dialog')) return

    try {
      player ??= createPagePressSound()
      void player?.play().catch(() => {})
    } catch {
      // Buttons remain functional on devices that cannot play audio.
    }
  }

  document.addEventListener('click', onClick)
  return () => {
    document.removeEventListener('click', onClick)
    player?.close()
  }
}
