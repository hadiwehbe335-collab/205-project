import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clockText, pointText, studyPoints, studyRequest } from './studyApi'
import { FocusEncouragement, FocusPortrait } from './DeviceFocus'
import { createFocusAlarm } from './startupSound'
import './studyFeatures.css'

const foreground = () => !document.hidden && document.hasFocus()

let profileRequest

function loadProfile() {
  if (!profileRequest) {
    const create = () => studyRequest('guest', {})
    const request = navigator.locks ? navigator.locks.request('mytutorly-study-profile', create) : create()
    profileRequest = request.finally(() => { profileRequest = undefined })
  }
  return profileRequest
}

function StudyFrame({ title, children, embeddedHeading = false, host }) {
  const [account, setAccount] = useState(undefined)
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    const result = await loadProfile()
    setAccount(result)
    setError('')
  }, [])

  useEffect(() => {
    let active = true
    loadProfile().then((result) => { if (active) setAccount(result) })
      .catch((failure) => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [])

  const loading = <>
    <h1>{title}</h1>
    {error && <p role="alert">{error} <button type="button" className="button button-secondary" onClick={() => refresh().catch((failure) => setError(failure.message))}>Retry</button></p>}
    {!error && account === undefined && <p role="status">Loading study profile…</p>}
  </>
  if (embeddedHeading) {
    return account ? children(account, refresh)
      : host && createPortal(<div className="study-feature">{loading}</div>, host)
  }
  return <div className="study-feature">{loading}{account && children(account, refresh)}</div>
}

export function FocusMode({ host, onExit, menuOpen }) {
  return <StudyFrame title="Focus Mode" embeddedHeading host={host}>{(account) => (
    <FocusTimer key={account.handle} host={host} onExit={onExit} menuOpen={menuOpen} />
  )}</StudyFrame>
}

function useFocusSession() {
  const [owner] = useState(() => crypto.randomUUID())
  const [session, setSession] = useState(undefined)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [history, setHistory] = useState([])
  const [completed, setCompleted] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const current = useRef(null)
  const queue = useRef(Promise.resolve())
  const working = useRef(null)
  const pulseQueued = useRef(false)
  const interrupted = useRef(null)

  const publish = useCallback((result) => {
    current.current = result
    setSession(result)
  }, [])

  const readHistory = useCallback(async () => {
    try {
      setHistory(await studyRequest('history'))
      setHistoryError('')
    } catch (failure) {
      setHistoryError(failure.message)
    }
  }, [])

  const refresh = useCallback(async () => {
    const result = await studyRequest(`session?owner=${owner}`)
    publish(result)
    setError('')
    return result
  }, [owner, publish])

  const send = useCallback((action, minutes, keepalive = false) => {
    if (action === 'pulse') {
      if (pulseQueued.current) return queue.current
      pulseQueued.current = true
    } else {
      setPending(true)
    }
    const job = queue.current.then(async () => {
      const active = current.current
      if (action === 'pulse' && (!foreground() || interrupted.current || active?.status !== 'running' || !active.canControl)) return
      if ((action === 'start' || action === 'resume') && !foreground()) return
      if (action === 'loss' && (active?.id !== interrupted.current || active?.status !== 'running' || !active.canControl)) return
      if (['pause', 'finish'].includes(action) && !foreground() && active?.status === 'running') return
      const id = action === 'start' ? crypto.randomUUID() : active?.id
      if (!id) return
      working.current = ['start', 'resume'].includes(action) ? id : null
      try {
        const result = await studyRequest('session', { id, owner, action, minutes, revision: active?.revision }, keepalive)
        publish(result)
        if (action === 'start' || action === 'finish') setCompleted(false)
        else if (!result && active?.status === 'running' && ['pulse', 'pause'].includes(action)) setCompleted(true)
        if (action === 'loss' || !result || interrupted.current !== result.id) setError('')
        if (action !== 'pulse' || !result) void readHistory()
        return result
      } catch (failure) {
        // Stop this document's pulses after an uncertain response. The lease expires on the server.
        interrupted.current = id
        setError(`${failure.message} Timer updates stopped. Reconnect to check the saved session.`)
      } finally {
        working.current = null
      }
    })
    queue.current = job
    void job.then(() => {
      if (action === 'pulse') pulseQueued.current = false
      else setPending(false)
    })
    return job
  }, [owner, publish, readHistory])

  const reconnect = useCallback(() => {
    queue.current = queue.current.then(async () => {
      try {
        const result = await refresh()
        if (result?.status === 'running' && result.canControl && interrupted.current === result.id) {
          setError('Waiting for the previous timer connection to expire. Reconnect again in a few seconds.')
        }
        void readHistory()
      } catch (failure) { setError(failure.message) }
    })
  }, [readHistory, refresh])

  useEffect(() => {
    function loseFocus() {
      const active = current.current
      const id = working.current || (active?.status === 'running' && active.canControl ? active.id : null)
      if (!id || interrupted.current === id) return
      interrupted.current = id
      void send('loss', undefined, true)
    }
    function visibility() {
      if (document.hidden) loseFocus()
    }
    function disconnect() {
      const active = current.current
      const id = working.current || (active?.status === 'running' && active.canControl ? active.id : null)
      if (!id) return
      interrupted.current = id
      setError('Connection lost. The timer stopped sending updates.')
    }
    reconnect()
    const interval = setInterval(() => {
      if (current.current?.status === 'running' && current.current.canControl && !interrupted.current && foreground()) void send('pulse')
    }, 4000)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', loseFocus)
    window.addEventListener('pagehide', loseFocus)
    window.addEventListener('offline', disconnect)
    window.addEventListener('online', reconnect)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('blur', loseFocus)
      window.removeEventListener('pagehide', loseFocus)
      window.removeEventListener('offline', disconnect)
      window.removeEventListener('online', reconnect)
      loseFocus()
    }
  }, [reconnect, send])

  async function control(action, minutes) {
    if (['resume', 'start'].includes(action)) interrupted.current = null
    return send(action, minutes)
  }


  return { session, completed, history, historyError, error, pending, control, reconnect }
}

function StudyClockPicker({ minutes, onChange }) {
  return <div className="study-clock-picker">
    <div className="study-clock-face" aria-hidden="true">
      <svg viewBox="0 0 120 120" focusable="false">
        <circle cx="60" cy="60" r="55" className="study-clock-rim" />
        {Array.from({ length: 12 }, (_, tick) => (
          <line key={tick} x1="60" y1="11" x2="60" y2={tick % 3 === 0 ? 19 : 15}
            transform={`rotate(${tick * 30} 60 60)`} />
        ))}
        <path d="M60 60V24" transform={`rotate(${minutes * 2} 60 60)`} className="study-clock-hand" />
        <circle cx="60" cy="60" r="4" className="study-clock-pin" />
      </svg>
    </div>
    <label htmlFor="focus-minutes">Study duration <strong>{minutes} min</strong></label>
    <input id="focus-minutes" type="range" min="1" max="180" step="1"
      value={minutes} aria-valuetext={`${minutes} minutes`}
      onChange={(event) => onChange(Number(event.target.value))} />
  </div>
}

function FocusCountdown({ remaining, total, revision, label, ticking, onBreakSelect, pending, menuOpen, interrupted, onBreak, completed, onAlarmDismiss }) {
  const [display, setDisplay] = useState(null)
  useEffect(() => {
    if (!ticking) return
    const started = performance.now()
    const interval = setInterval(() => {
      setDisplay({ revision, elapsed: Math.min(4000, performance.now() - started) })
    }, 200)
    return () => clearInterval(interval)
  }, [revision, ticking])

  const elapsed = ticking && display?.revision === revision ? display.elapsed : 0
  const shown = Math.max(0, remaining - elapsed)
  const percent = 100 * shown / total
  const style = completed || (onBreak && remaining === 0) ? 'complete' : onBreak ? 'break' : interrupted ? 'interrupted' : 'study'
  return <aside className={`study-countdown study-countdown-${style}`} aria-label="Focus timer" inert={menuOpen || undefined}>
    {interrupted || completed ? <FocusPortrait interrupted={interrupted} complete={completed} /> : <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
      <circle className="study-countdown-track" cx="24" cy="24" r="20" />
      <circle className="study-countdown-ring" cx="24" cy="24" r="20" pathLength="100"
        strokeDasharray={`${percent} 100`} transform="rotate(-90 24 24)" />
      <path className="study-countdown-hand" d="M24 14v10l6 4" />
    </svg>}
    <div className="study-countdown-readout">
      <span role={interrupted || completed ? 'status' : undefined}>{label}</span>
      {!completed && <time role="timer" aria-label={label}>{clockText(shown).replace(/^00:/, '')}</time>}
    </div>
    {onAlarmDismiss && <button type="button" className="study-countdown-dismiss" onClick={onAlarmDismiss}>Turn off alarm</button>}
    {onBreakSelect && <fieldset className="study-countdown-breaks">
      <legend>Take a break</legend>
      <div>{[['Short break', 2], ['Medium break', 5], ['Long break', 10]].map(([name, minutes]) => (
        <button type="button" key={minutes} disabled={pending}
          aria-label={`${name}, ${minutes} minutes`} onClick={() => onBreakSelect(minutes)}>{minutes} min</button>
      ))}</div>
    </fieldset>}
  </aside>
}

function FocusTimer({ host, onExit, menuOpen }) {
  const [minutes, setMinutes] = useState(25)
  const [keepAwake, setKeepAwake] = useState(false)
  const [deviceMessage, setDeviceMessage] = useState('')
  const pauseButton = useRef(null)
  const alarm = useRef(null)
  const [alarmDismissed, setAlarmDismissed] = useState(false)
  const { session, completed, history, historyError, error, pending, control, reconnect } = useFocusSession()
  const running = session?.status === 'running'
  const controlling = running && session.canControl && !error
  const interrupted = session?.status === 'interrupted'
  const [breakDuration, setBreakDuration] = useState(null)
  const [breakLeft, setBreakLeft] = useState(0)
  const onBreak = session?.status === 'paused' && breakDuration !== null

  useEffect(() => {
    if (host && document.activeElement === document.body) {
      host.querySelector('h1')?.focus({ preventScroll: true })
    }
  }, [host])

  useEffect(() => {
    if (!onBreak) return
    const ends = Date.now() + breakDuration
    const tick = setInterval(() => setBreakLeft(Math.max(0, ends - Date.now())), 250)
    return () => clearInterval(tick)
  }, [breakDuration, onBreak])

  const alarmKind = completed ? 'study' : onBreak && breakLeft === 0 ? 'break' : null
  const showAlarmControl = Boolean(alarmKind && !pending && !alarmDismissed)

  useEffect(() => {
    if (showAlarmControl) alarm.current?.ring(alarmKind)
  }, [alarmKind, showAlarmControl])

  useEffect(() => () => {
    alarm.current?.close()
    alarm.current = null
  }, [])

  function dismissAlarm() {
    alarm.current?.close()
    alarm.current = null
    setAlarmDismissed(true)
  }

  function armAlarm() {
    alarm.current ??= createFocusAlarm()
    setAlarmDismissed(false)
  }

  async function startBreak(duration) {
    armAlarm()
    const span = duration * 60_000
    const paused = await control('pause')
    if (paused?.status !== 'paused') return
    setBreakLeft(span)
    setBreakDuration(span)
  }

  function resumeStudy() {
    dismissAlarm()
    armAlarm()
    setBreakDuration(null)
    void control('resume')
  }

  useEffect(() => {
    if (controlling && document.activeElement === document.body) pauseButton.current?.focus({ preventScroll: true })
  }, [controlling])

  useEffect(() => {
    if (!keepAwake || !running || !session.canControl) return
    let lock
    let cancelled = false
    async function acquire() {
      if (document.hidden || (lock && !lock.released)) return
      try {
        const acquired = await navigator.wakeLock.request('screen')
        if (cancelled || document.hidden) await acquired.release()
        else if (lock && !lock.released) await acquired.release()
        else lock = acquired
      } catch { if (!cancelled) setDeviceMessage('Your device declined the screen wake lock.') }
    }
    void acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release().catch(() => {})
    }
  }, [keepAwake, running, session?.canControl])

  const title = interrupted ? 'Focus interrupted' : completed ? 'You did it!'
    : onBreak ? (breakLeft ? 'Take a break' : 'Break complete')
      : running ? 'Stay focused' : session?.status === 'paused' ? 'Study paused' : 'Focus with Ollie'
  const style = interrupted ? 'interrupted' : completed ? 'complete' : onBreak ? 'break' : 'ready'

  const showDock = completed || controlling || onBreak || interrupted || (!host && session?.canControl)
  const dockLabel = completed ? 'Study complete' : onBreak ? (breakLeft ? 'Break left' : 'Break complete') : controlling ? 'Time left' : interrupted ? 'Focus interrupted' : 'Paused'

  return <>
    {showDock && <FocusCountdown
      label={dockLabel}
      interrupted={interrupted}
      onBreak={onBreak}
      completed={completed}
      remaining={onBreak ? breakLeft : session ? session.target - session.focused : 0}
      total={onBreak ? breakDuration : session?.target ?? 1}
      revision={session?.revision}
      ticking={controlling}
      onBreakSelect={controlling ? startBreak : null}
      onAlarmDismiss={showAlarmControl ? dismissAlarm : null}
      pending={pending}
      menuOpen={menuOpen}
    />}
    {host && createPortal(<div className="study-feature study-focus-feature">
      <section className={`focus-page focus-page-${style} study-timer`} aria-labelledby="focus-session-title">
        <div className="focus-session">
          <FocusPortrait interrupted={interrupted} complete={completed} onBreak={onBreak} />
          <h1 id="focus-session-title" tabIndex={-1}>{title}</h1>
          {session === undefined && <p role="status">Loading timer…</p>}
          {session === null && <>
            <p>{completed ? 'You finished your focus session. Take a moment to enjoy the progress you made.' : 'Set a timer and study anywhere in MyTutorly. Ollie will cheer you on.'}</p>
            <form className="focus-start" onSubmit={(event) => { event.preventDefault(); armAlarm(); setBreakDuration(null); void control('start', minutes) }}>
              <StudyClockPicker minutes={minutes} onChange={setMinutes} />
              <button className="button button-primary" disabled={pending || Boolean(error)}>Start timer</button>
            </form>
          </>}
          {session && <>
            {interrupted && <p role="status">MyTutorly lost focus. 10 points deducted. Resume when you’re ready.</p>}
            {session.status === 'disconnected' && <p role="status">Connection expired. Resume when you’re ready.</p>}
            {!session.canControl && <p role="status">Studying in another tab or device.</p>}
            {!showDock && <div role="timer" aria-label="Study time remaining" className="focus-clock">
              {clockText(session.target - session.focused).replace(/^00:/, '')}
            </div>}
            {onBreak && <p>{breakLeft ? 'Ollie will wait here while you rest.' : 'Your break is over. Resume studying when you’re ready.'}</p>}
            {controlling && <FocusEncouragement focused={session.focused} />}
            <p>{pointText(studyPoints(session))} points · {pointText(Math.abs(session.penalties) / 10)} interruptions</p>
            {session.canControl && <div className="study-feature-actions">
              <button ref={pauseButton} className="button button-primary" disabled={pending || Boolean(error)} onClick={() => running ? control('pause') : resumeStudy()}>{running ? 'Pause' : 'Resume'}</button>
              <button className="button button-secondary" disabled={pending || Boolean(error)} onClick={() => { dismissAlarm(); setBreakDuration(null); void control('finish') }}>End session</button>
            </div>}
          </>}
          {(error || (session && !session.canControl)) && <button type="button" className="button button-secondary" onClick={reconnect}>Reconnect timer</button>}
          {error && <p role="alert">{error}</p>}
          <div className="study-timer-controls">
            <button className="button button-secondary" type="button" disabled={pending} onClick={onExit}>{controlling || onBreak ? 'Back to Dashboard' : 'Exit Focus Mode'}</button>
          </div>
          {navigator.wakeLock && <label className="study-check"><input type="checkbox" checked={keepAwake} onChange={(event) => { setKeepAwake(event.target.checked); setDeviceMessage('') }} /> Keep screen awake while studying</label>}
          {deviceMessage && <p role="status">{deviceMessage}</p>}
          <details className="study-focus-help"><summary>How Focus Mode works</summary>
            <p>You can use any page in MyTutorly while the timer runs. Switching to another browser tab or app pauses the timer and can cost 10 points.</p>
          </details>
        </div>
      </section>
      <section className="study-feature-card">
        <h2>Study history</h2>
        <p>Earn 100 points per hour of eligible focus time. Each detected interruption deducts 10 points. Pauses and connection gaps earn zero points. The timer updates when the server confirms time.</p>
        {historyError && <p role="alert">{historyError}</p>}
        {history.length ? <ul className="study-records">{history.map((item) => <li key={item.id}>
          <div><strong>{clockText(item.focused)} focused</strong><small>{new Date(item.checked).toLocaleString()}</small></div>
          <span>{pointText(item.focused / 36_000)} earned · {pointText(-item.penalties)} deducted · <strong>{pointText(studyPoints(item))} total</strong></span>
        </li>)}</ul> : <p>Saved sessions will appear here.</p>}
      </section>
    </div>, host)}
  </>
}

export function StudyLeaderboards() {
  return <StudyFrame title="Study Leaderboards">{(account, refresh) => <Community key={account.handle} account={account} refreshAccount={refresh} />}</StudyFrame>
}

const demoFriends = [
  { handle: 'Aisha', focused: 10_800_000, penalties: -20, demo: true },
  { handle: 'Omar', focused: 5_400_000, penalties: -10, demo: true },
]

function Rankings({ title, rows, empty }) {
  return <section className="study-feature-card">
    <h2>{title}</h2>
    {rows?.length ? <ol className="study-ranks">{rows.map((row) => <li key={row.handle}><span>{row.handle}{row.demo && <small className="study-demo-label">Demo user</small>}</span><strong>{pointText(studyPoints(row))} pts</strong></li>)}</ol> : <p>{empty}</p>}
  </section>
}

function Community({ account, refreshAccount }) {
  const [friends, setFriends] = useState([])
  const [boards, setBoards] = useState(null)
  const [match, setMatch] = useState(undefined)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const [relations, rankings] = await Promise.all([studyRequest('friends'), studyRequest('leaderboards')])
    setFriends(relations)
    setBoards(rankings)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([studyRequest('friends'), studyRequest('leaderboards')]).then(([relations, rankings]) => {
      if (active) { setFriends(relations); setBoards(rankings) }
    }).catch((failure) => { if (active) setMessage(failure.message) })
    return () => { active = false }
  }, [])

  async function perform(action) {
    setBusy(true)
    setMessage('')
    try { await action() } catch (failure) { setMessage(failure.message) } finally { setBusy(false) }
  }

  function relation(action, handle) {
    void perform(async () => {
      setFriends(await studyRequest('friends', { action, handle }))
      setMatch(undefined)
      await refresh()
    })
  }

  function privacy(changes) {
    void perform(async () => {
      await studyRequest('privacy', { discoverable: account.discoverable, schoolShare: account.schoolShare, ...changes })
      await refreshAccount()
      await refresh()
    })
  }

  return <>
    <section className="study-feature-card">
      <h2>Your study profile</h2>
      <p>Your username is <strong>{account.handle}</strong></p>
      <label className="study-check"><input type="checkbox" checked={account.discoverable} disabled={busy} onChange={(event) => privacy({ discoverable: event.target.checked })} /> Let people find me by exact username and send requests</label>
      <p>{account.institution ? `Verified affiliation · ${account.institution}` : 'Ask your MyTutorly administrator to verify your school or university affiliation.'}</p>
      {account.institution && <label className="study-check"><input type="checkbox" checked={account.schoolShare} disabled={busy} onChange={(event) => privacy({ schoolShare: event.target.checked })} /> Share my username and score with opted-in members of my verified institution</label>}
    </section>
    <section className="study-feature-card">
      <h2>Friends</h2>
      <p>Accepted friends can see each other’s study scores.</p>
      <form className="study-feature-form" onSubmit={(event) => {
        event.preventDefault()
        const handle = new FormData(event.currentTarget).get('handle')
        void perform(async () => { setMatch(await studyRequest(`search?handle=${encodeURIComponent(handle)}`)) })
      }}>
        <label>Exact username<input name="handle" required minLength={3} maxLength={24} /></label>
        <button className="button button-primary" disabled={busy}>Search</button>
      </form>
      {match === null && <p role="status">No discoverable study account found.</p>}
      {match && <p>{match.handle} {' '}<button className="button button-secondary" disabled={busy || friends.some((friend) => friend.handle === match.handle)} onClick={() => relation('add', match.handle)}>Send friend request</button></p>}
      {friends.length > 0 && <ul className="study-records">{friends.map((friend) => <li key={friend.handle}>
        <div><strong>{friend.handle}</strong><small>{friend.accepted ? 'Friend' : friend.outgoing ? 'Request sent' : 'Incoming request'}</small></div>
        <div className="study-feature-actions">
          {!friend.accepted && !friend.outgoing && <button className="button button-primary" disabled={busy} onClick={() => relation('accept', friend.handle)} aria-label={`Accept request from ${friend.handle}`}>Accept</button>}
          <button className="button button-secondary" disabled={busy} onClick={() => relation('remove', friend.handle)} aria-label={`Remove friend or request for ${friend.handle}`}>{friend.accepted ? 'Remove' : friend.outgoing ? 'Cancel request' : 'Decline'}</button>
        </div>
      </li>)}</ul>}
      <button className="button button-secondary" disabled={busy} onClick={() => perform(refresh)}>Refresh friends and rankings</button>
      {message && <p role="alert">{message}</p>}
    </section>
    <div className="study-board-grid">
      <Rankings title="Friends leaderboard" rows={[...(boards?.friends ?? []), ...demoFriends].sort((a, b) => studyPoints(b) - studyPoints(a))} empty="Friend scores appear here after you connect." />
      <Rankings title="School leaderboard" rows={boards?.school} empty="Verify your affiliation and opt in to see scores from your institution." />
    </div>
  </>
}
