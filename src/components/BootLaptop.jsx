import { useLayoutEffect, useRef } from 'react'
import wordmark from '../assets/wordmark-cream.png'
import ollie from '../assets/ollie/hi.png'
import './bootLaptop.css'

export const cameraTime = 1160
const keyboard = [14, 14, 13, 12, 7]

export default function BootLaptop({ zooming, onBoot, onEntered, buttonRef }) {
  const rig = useRef(null)
  const screen = useRef(null)

  useLayoutEffect(() => {
    if (!zooming) return
    const stage = rig.current
    const camera = stage.getBoundingClientRect()
    const target = screen.current.getBoundingClientRect()
    const scale = Math.max(camera.width / target.width, camera.height / target.height) * 1.16
    const x = camera.width / 2 - (target.left - camera.left + target.width / 2) * scale
    const y = camera.height / 2 - (target.top - camera.top + target.height / 2) * scale
    const move = stage.animate([
      { transform: 'translate3d(0, 0, 0) scale(1)', offset: 0.14, easing: 'cubic-bezier(.54,.04,.17,1)' },
      { transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})` },
    ], { duration: cameraTime, fill: 'forwards' })
    let active = true
    void move.finished.then(() => { if (active) onEntered() }, () => {})
    return () => {
      active = false
      move.cancel()
    }
  }, [zooming, onEntered])

  return (
    <div className={`boot-scene${zooming ? ' boot-zooming' : ''}`}>
      <div className="boot-room" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
      <div className="boot-camera" ref={rig}>
        <div className="boot-set">
          <div className="boot-laptop">
            <div className="boot-lid">
              <div className="boot-webcam" aria-hidden="true" />
              <div className="boot-screen" ref={screen}>
                <div className="boot-screen-glow" aria-hidden="true" />
                <div className="boot-display">
                  <div className="boot-status"><i aria-hidden="true" /> MyTutorly system</div>
                  <img className="boot-wordmark" src={wordmark} width="460" height="114" alt="MyTutorly" />
                  <p>Ready when you are.</p>
                </div>
                <div className="boot-sticker" aria-hidden="true">
                  <img src={ollie} width="174" height="212" alt="" />
                </div>
              </div>
              <span className="boot-lid-mark" aria-hidden="true" />
            </div>
            <div className="boot-deck" aria-hidden="true">
              <div className="boot-hinge" />
              <div className="boot-speakers" />
              <div className="boot-keyboard">
                {keyboard.map((keys, row) => (
                  <div key={row} className="boot-keys">
                    {Array.from({ length: keys }, (_, key) => <span key={key} />)}
                  </div>
                ))}
              </div>
              <div className="boot-trackpad" />
              <div className="boot-chassis" />
            </div>
          </div>
          <div className="boot-actions">
            <button type="button" className="boot-button" ref={buttonRef} onClick={onBoot} aria-disabled={zooming || undefined}>
              <span aria-hidden="true">⏻</span> BOOT UP
            </button>
            <p>Your learning universe awaits.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
