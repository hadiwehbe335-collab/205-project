import { useEffect, useRef, useState } from 'react'
import Ollie from './Ollie'
import { createFocusAlarm } from './startupSound'
import './deviceFocus.css'

const breakOptions = [['Short break', 2], ['Medium break', 5], ['Long break', 10]]

const quotes = [
  'One idea at a time. That is how big things get learned.',
  'You only need to take the next step.',
  'Small study sessions build real confidence.',
  'A tricky question is a chance to notice something new.',
  'Give the problem a moment. Your brain is making connections.',
  'Every time you recall it, you make it easier to remember.',
  'Make it clear enough that you could explain it to a friend.',
  'Stay curious. The next example might make it click.',
]

export function DeviceFocusShare() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const linkField = useRef(null)
  const url = new URL(window.location.pathname, window.location.origin)
  url.searchParams.set('view', 'device-focus')
  const digits = phone.replace(/[+()\s.-]/g, '')
  const validPhone = /^[1-9][0-9]{6,14}$/.test(digits)
  const localAddress = /^(?:localhost$|127\.|\[::1\]$)/.test(url.hostname)
  const shareText = `Open MyTutorly to start an Ollie focus session: ${url.href}`
  const shareUrl = `https://wa.me/${digits}?text=${encodeURIComponent(shareText)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url.href)
      setMessage('Link copied.')
    } catch {
      linkField.current?.focus()
      linkField.current?.select()
      setMessage('Link selected. Copy it to share.')
    }
  }

  return (
    <section className="focus-share" id="device-focus-share" aria-labelledby="focus-share-title">
      <div>
        <h2 id="focus-share-title">Lock devices</h2>
        <p>Open this link on a device you want to set aside. Ollie will ask you to retry if you leave its focus timer.</p>
      </div>
      {localAddress && <p>This address only works on this device. Open MyTutorly at a shared web address to send a working link.</p>}
      <div className="focus-share-grid">
        <div className="focus-field">
          <label htmlFor="device-focus-link">Focus session link</label>
          <div className="focus-field-row">
            <input ref={linkField} id="device-focus-link" readOnly value={url.href} />
            <button type="button" className="button button-secondary" onClick={copyLink}>Copy link</button>
          </div>
          <a className="text-button" href={url.href} target="_blank" rel="noopener noreferrer">Open focus timer</a>
          {message && <p role="status">{message}</p>}
        </div>
        <div className="focus-field">
          <label htmlFor="device-focus-phone">WhatsApp phone number</label>
          <div className="focus-field-row">
            <input id="device-focus-phone" type="tel" autoComplete="tel" inputMode="tel"
              aria-describedby="device-focus-phone-help" value={phone}
              onChange={(event) => setPhone(event.target.value)} />
            {validPhone ? (
              <a className="button button-primary" href={shareUrl} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
            ) : (
              <button type="button" className="button button-primary" disabled>Share on WhatsApp</button>
            )}
          </div>
          <p id="device-focus-phone-help">Include the country code, for example +971 50 123 4567.</p>
        </div>
      </div>
    </section>
  )
}

function TypedQuote({ text }) {
  const [length, setLength] = useState(0)
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    let count = 0
    const timer = setInterval(() => {
      count = Math.min(count + 1, text.length)
      setLength(count)
      if (count === text.length) clearInterval(timer)
    }, 28)
    return () => clearInterval(timer)
  }, [text])

  return <blockquote className="focus-quote">
    <span aria-hidden="true" className="focus-quote-typed">{text.slice(0, length)}</span>
    <span aria-hidden="true" className="focus-quote-static">{text}</span>
    <span className="focus-sr-only">{text}</span>
  </blockquote>
}

export function FocusEncouragement({ focused }) {
  const slot = Math.floor(focused / 15_000)
  return <div className="focus-encouragement" aria-live="polite" aria-atomic="true">
    <TypedQuote key={slot} text={quotes[slot % quotes.length]} />
  </div>
}

export function FocusPortrait({ interrupted, complete, onBreak }) {
  return <div className="focus-portrait" aria-hidden="true">
    <Ollie expression={interrupted ? 'whoa' : complete ? 'great-job' : onBreak ? 'rest' : 'hi'} size={110} />
    {interrupted && <svg viewBox="0 0 174 212" focusable="false" className="focus-portrait-angry">
      <path d="M51 108l22 9m28 0 22-9" stroke="#1B1F3B" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="87" cy="155" rx="10" ry="12" fill="#7CC6FF" />
      <path d="M80 157q7-9 14 0" stroke="#1B1F3B" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>}
  </div>
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function DeviceFocus() {
  const [resumeStudy, setResumeStudy] = useState(() => history.state?.deviceFocusResume ?? 0)
  const [minutes, setMinutes] = useState(() => String(resumeStudy ? Math.ceil(resumeStudy / 60000) : history.state?.deviceFocusMinutes ?? 25))
  const [savedBreak] = useState(() => history.state?.deviceFocusBreak)
  const [status, setStatus] = useState(() => {
    if (savedBreak) return 'break'
    if (resumeStudy) return 'ready'
    return history.state?.deviceFocusMinutes ? 'interrupted' : 'ready'
  })
  const [breakUsed, setBreakUsed] = useState(() => Boolean(history.state?.deviceFocusBreakUsed))
  const [remaining, setRemaining] = useState(0)
  const [quote, setQuote] = useState(null)
  const run = useRef(savedBreak ? { pause: savedBreak, slot: -1, quote: -1 } : null)
  const heading = useRef(null)
  const alarm = useRef(null)
  const duration = Number(minutes)
  const validDuration = Number.isInteger(duration) && duration >= 1 && duration <= 180
  const timerActive = status === 'running' || status === 'break'

  useEffect(() => {
    const current = heading.current
    current?.focus({ preventScroll: true })
  }, [status])

  useEffect(() => () => {
    alarm.current?.close()
    alarm.current = null
  }, [])

  useEffect(() => {
    if (status !== 'break-alarm' && status !== 'complete') return
    alarm.current ??= createFocusAlarm()
    alarm.current?.ring(status === 'break-alarm' ? 'break' : 'study')
  }, [status])

  function turnOffAlarm() {
    alarm.current?.close()
    alarm.current = null
    if (status === 'break-alarm') {
      const state = { ...history.state }
      const studyLeft = state.deviceFocusBreak.studyLeft
      delete state.deviceFocusBreak
      history.replaceState({ ...state, deviceFocusResume: studyLeft }, '')
      setResumeStudy(studyLeft)
      setMinutes(String(Math.ceil(studyLeft / 60000)))
    }
    setStatus('ready')
  }

  function start() {
    if (!validDuration || run.current || document.hidden) return
    alarm.current ??= createFocusAlarm()
    const state = { ...history.state, deviceFocusMinutes: duration }
    delete state.deviceFocusResume
    history.replaceState(state, '')
    const span = resumeStudy && duration === Math.ceil(resumeStudy / 60000) ? resumeStudy : duration * 60000
    setResumeStudy(0)
    const started = Date.now()
    run.current = { started, ends: started + span, slot: -1, quote: -1 }
    setRemaining(Math.ceil(span / 1000))
    setQuote(null)
    setStatus('running')
  }

  function startBreak(event) {
    const breakMinutes = Number(event.currentTarget.value)
    const active = run.current
    const now = Date.now()
    if (breakUsed || !active || active.pause || now >= active.ends) return
    alarm.current ??= createFocusAlarm()
    const pause = { ends: now + breakMinutes * 60000, studyLeft: active.ends - now }
    run.current = { ...active, pause }
    history.replaceState({ ...history.state, deviceFocusBreak: pause, deviceFocusBreakUsed: true }, '')
    setBreakUsed(true)
    setRemaining(breakMinutes * 60)
    setStatus('break')
  }

  useEffect(() => {
    if (!timerActive) return

    function finish(result) {
      run.current = null
      setStatus(result)
    }

    function tick() {
      const active = run.current
      if (!active) return
      const now = Date.now()
      if (active.pause) {
        const { ends } = active.pause
        setRemaining(Math.max(0, Math.ceil((ends - now) / 1000)))
        if (now >= ends) finish('break-alarm')
        return
      }
      if (now >= active.ends) {
        setRemaining(0)
        const state = { ...history.state }
        delete state.deviceFocusMinutes
        delete state.deviceFocusBreakUsed
        setBreakUsed(false)
        history.replaceState(state, '')
        finish('complete')
        return
      }
      setRemaining(Math.ceil((active.ends - now) / 1000))
      const slot = Math.floor((now - active.started) / 15000)
      if (slot <= active.slot) return
      const candidates = quotes.filter((_, index) => index !== active.quote)
      const text = candidates[Math.floor(Math.random() * candidates.length)]
      active.quote = quotes.indexOf(text)
      active.slot = slot
      setQuote({ slot, text })
    }

    function interrupt() {
      const active = run.current
      if (!active || active.pause) return
      if (Date.now() >= active.ends) {
        tick()
      } else {
        alarm.current?.close()
        alarm.current = null
        finish('interrupted')
      }
    }

    function onVisibility() {
      if (document.hidden) interrupt()
      else tick()
    }

    const timer = setInterval(tick, 200)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', tick)
    window.addEventListener('blur', interrupt)
    window.addEventListener('pagehide', interrupt)
    tick()
    onVisibility()
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', tick)
      window.removeEventListener('blur', interrupt)
      window.removeEventListener('pagehide', interrupt)
    }
  }, [timerActive])

  const interrupted = status === 'interrupted'
  const complete = status === 'complete'
  const running = status === 'running'
  const onBreak = status === 'break'
  const breakAlarm = status === 'break-alarm'
  const title = {
    ready: 'Focus with Ollie', running: 'Stay focused', break: 'Take a break',
    interrupted: 'Focus interrupted', complete: 'You did it!', 'break-alarm': 'Break complete'
  }[status]

  return <main className={`focus-page focus-page-${breakAlarm ? 'break' : status}`}>
    <section className="focus-session" aria-labelledby="focus-session-title">
      <FocusPortrait interrupted={interrupted} complete={complete} onBreak={onBreak || breakAlarm} />
      <h1 ref={heading} tabIndex={-1} id="focus-session-title">{title}</h1>
      {status === 'ready' && <>
        <p>{resumeStudy
          ? `You have ${formatTime(Math.ceil(resumeStudy / 1000))} of study time left. Start with what’s left or choose a new duration.`
          : 'Set a timer, leave this page open, and study. Ollie will cheer you on.'}</p>
        <form className="focus-start" onSubmit={(event) => { event.preventDefault(); start() }}>
          <label htmlFor="focus-minutes">Minutes</label>
          <input id="focus-minutes" type="number" inputMode="numeric" min="1" max="180" step="1" required
            value={minutes} onChange={(event) => setMinutes(event.target.value)} />
          <button className="button button-primary" type="submit" disabled={!validDuration}>Start timer</button>
        </form>
      </>}
      {running && <>
        <div className="focus-clock" role="timer" aria-label="Time remaining">{formatTime(remaining)}</div>
        <div className="focus-encouragement" aria-live="polite" aria-atomic="true">
          {quote && <TypedQuote key={quote.slot} text={quote.text} />}
        </div>
        {breakUsed ? <p className="focus-break-note">Break used</p> : (
          <fieldset className="focus-break-options">
            <legend>Take one break during this session</legend>
            <div>
              {breakOptions.map(([label, length]) => (
                <button key={length} type="button" className="button button-secondary" value={length} onClick={startBreak}>
                  {label}<span>{length} min</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </>}
      {onBreak && <>
        <div className="focus-clock" role="timer" aria-label="Break time remaining">{formatTime(remaining)}</div>
        <p>Ollie will wait here. An alarm will let you know when break time is over.</p>
      </>}
      {breakAlarm && <>
        <p>Your break is over. Turn off the alarm to choose your study time.</p>
        <button type="button" className="button button-primary" onClick={turnOffAlarm}>Turn off alarm</button>
      </>}
      {interrupted && <>
        <p>You left the focus page. Come back ready to give it another go.</p>
        <button type="button" className="button button-primary" onClick={start}>Try again</button>
      </>}
      {complete && <>
        <p>You finished your focus session. Take a moment to enjoy the progress you made.</p>
        <button type="button" className="button button-primary" onClick={turnOffAlarm}>Turn off alarm</button>
      </>}
    </section>
  </main>
}
