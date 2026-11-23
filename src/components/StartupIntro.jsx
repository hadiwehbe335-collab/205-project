import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import inkWordmark from '../assets/wordmark-ink.png'
import greeting from '../assets/ollie/hi.png'
import arrival from '../assets/ollie/whoa.png'
import { createStartupSound } from './startupSound'
import { readTransitionSound, writeTransitionSound } from './transitionSoundPreference'
import BootLaptop, { cameraTime } from './BootLaptop'
import './startupIntro.css'

const seenKey = 'mytutorly.laptop-boot.seen.v1'
const duration = 3780
const stillDuration = 900
const colors = ['#5BB8FF', '#FFD84D', '#7CC6FF', '#7BD88F']
const particles = Array.from({ length: 32 }, (_, index) => {
  const angle = index * 2.399963
  const distance = 65 + (index * 37) % 235
  return {
    '--x': Math.round(Math.cos(angle) * distance) + 'px',
    '--y': Math.round(Math.sin(angle) * distance * 0.74) + 'px',
    '--wait': (index * 19 % 170) + 'ms',
    '--size': (3 + index * 7 % 10) + 'px',
    '--color': colors[index % colors.length],
  }
})

function isUnseen() {
  if (new URLSearchParams(window.location.search).get('view') === 'device-focus') return false
  try { return sessionStorage.getItem(seenKey) !== '1' } catch { return true }
}

function markSeen() {
  try { sessionStorage.setItem(seenKey, '1') } catch { /* Storage may be disabled. */ }
}

export default function StartupIntro() {
  const [visible, setVisible] = useState(isUnseen)
  const [phase, setPhase] = useState('ready')
  const [still, setStill] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [soundEnabled, setSoundEnabled] = useState(readTransitionSound)
  const dialog = useRef(null)
  const bootButton = useRef(null)
  const skip = useRef(null)
  const sound = useRef(null)
  const bootedAt = useRef(null)
  const systemDelay = useRef(0)
  const enterSystem = useCallback(() => {
    if (document.activeElement === bootButton.current) skip.current?.focus({ preventScroll: true })
    setPhase('system')
  }, [])

  const finish = useCallback(() => {
    markSeen()
    sound.current?.close()
    sound.current = null
    setVisible(false)
  }, [])

  useLayoutEffect(() => {
    if (!visible) return
    const element = dialog.current
    const previousFocus = document.activeElement
    element.showModal()
    bootButton.current?.focus({ preventScroll: true })
    return () => {
      element.close()
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      } else {
        const heading = document.querySelector('#workspace-content h1, main h1')
        if (heading) {
          heading.setAttribute('tabindex', '-1')
          heading.focus({ preventScroll: true })
        }
      }
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    function update(event) {
      setStill(event.matches)
      if (event.matches && phase === 'zoom') enterSystem()
    }
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [visible, phase, enterSystem])

  useEffect(() => {
    if (!visible || phase !== 'system') return
    const timer = setTimeout(finish, (still ? stillDuration : duration) + 80)
    return () => clearTimeout(timer)
  }, [visible, phase, still, finish])

  useEffect(() => () => {
    sound.current?.close()
    sound.current = null
  }, [])

  function startSound() {
    if (sound.current) return
    try {
      const player = createStartupSound()
      if (!player) return
      sound.current = player
      void player.play(() => (performance.now() - bootedAt.current) / 1000, systemDelay.current / 1000, still)
        .catch(() => {
          if (sound.current === player) {
            player.close()
            sound.current = null
          }
        })
    } catch {
      // Audio can be unavailable while the rest of the intro still runs.
    }
  }

  function boot() {
    if (bootedAt.current !== null) return
    bootedAt.current = performance.now()
    systemDelay.current = still ? 0 : cameraTime
    if (soundEnabled) startSound()
    if (still) enterSystem()
    else setPhase('zoom')
  }

  function toggleSound() {
    if (soundEnabled) {
      sound.current?.close()
      sound.current = null
    } else if (bootedAt.current !== null) {
      startSound()
    }
    writeTransitionSound(!soundEnabled)
    setSoundEnabled(!soundEnabled)
  }

  if (!visible) return null

  return (
    <dialog ref={dialog} className={`startup-dialog startup-${phase}${still ? ' startup-still' : ''}`}
      aria-label="MyTutorly laptop boot-up" onCancel={(event) => { event.preventDefault(); finish() }}>
      {phase !== 'system' ? (
        <BootLaptop zooming={phase === 'zoom'} onBoot={boot} onEntered={enterSystem} buttonRef={bootButton} />
      ) : (
        <div className="startup-stage" onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === 'startup-dissolve') finish()
        }}>
          <div className="startup-cream" aria-hidden="true" />
          <div className="startup-atmosphere" aria-hidden="true" />
          <div className="startup-awakening" aria-hidden="true">
            <span className="startup-core" />
            <span className="startup-ring" />
            <span className="startup-ring startup-ring-echo" />
          </div>
          <div className="startup-stars" aria-hidden="true">
            {particles.map((style, index) => <i key={index} style={style} />)}
          </div>
          <div className="startup-portrait" aria-hidden="true">
            <div className="startup-shadow" />
            <div className="startup-impact">
              <span /><span />
              {particles.slice(0, 18).map((style, index) => <i key={index} style={style} />)}
            </div>
            <div className="startup-ollie">
              <div className="startup-ollie-art">
                <img className="startup-face startup-arrival" src={arrival} alt="" width="174" height="212" />
                <img className="startup-face startup-greeting" src={greeting} alt="" width="174" height="212" />
                <img className="startup-cap" src={greeting} alt="" width="174" height="212" />
              </div>
            </div>
          </div>
          <div className="startup-brand">
            <img src={inkWordmark} alt="MyTutorly" width="460" height="114" />
            <p className="startup-tagline">Learning without borders.</p>
            <p className="startup-welcome">Your course. Your way.</p>
          </div>
        </div>
      )}
      <div className="startup-controls">
        {typeof window.AudioContext === 'function' && (
          <button type="button" onClick={toggleSound} aria-label="Sound" aria-pressed={soundEnabled}>
            Sound {soundEnabled ? 'on' : 'off'}
          </button>
        )}
        <button type="button" ref={skip} onClick={finish}>Skip intro</button>
      </div>
    </dialog>
  )
}
