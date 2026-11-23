// Each tone specifies start pitch, end pitch, relative delay, duration, and gain.
const powerOn = [
  [255, 75, 0, 0.13, 0.24],
  [620, 240, 0.004, 0.054, 0.14],
  [330, 440, 0.14, 0.49, 0.10],
  [495, 660, 0.26, 0.58, 0.085],
  [660, 880, 0.43, 0.62, 0.075],
  [1100, 1100, 0.60, 0.52, 0.046],
]
const systemCues = [
  { at: 0.12, tones: [[432, 660, 0, 0.55, 0.07], [648, 880, 0.09, 0.48, 0.04]] },
  { at: 1.29, tones: [[205, 83, 0, 0.19, 0.20], [430, 265, 0.012, 0.14, 0.055]] },
  { at: 1.91, tones: [[659, 659, 0, 0.38, 0.09], [880, 880, 0.06, 0.38, 0.07], [1319, 1319, 0.13, 0.4, 0.045]] },
]

function createSoundPlayer() {
  if (!window.AudioContext) return null
  const context = new AudioContext()
  const output = context.createGain()
  output.gain.value = 0.55
  output.connect(context.destination)
  const voices = new Set()

  function tone(start, [from, to, offset, duration, volume], speed = 1) {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const begin = start + offset * speed
    const end = begin + duration * speed
    oscillator.frequency.setValueAtTime(from, begin)
    oscillator.frequency.exponentialRampToValueAtTime(to, end)
    envelope.gain.setValueAtTime(0.0001, begin)
    envelope.gain.exponentialRampToValueAtTime(volume, begin + Math.min(0.017, duration * speed / 3))
    envelope.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(envelope)
    envelope.connect(output)
    oscillator.onended = () => {
      oscillator.disconnect()
      envelope.disconnect()
      voices.delete(oscillator)
    }
    voices.add(oscillator)
    oscillator.start(begin)
    oscillator.stop(end)
  }

  return {
    async resume() {
      await context.resume()
      return context.state === 'running'
    },
    play(note, delay = 0, speed = 1) {
      if (context.state === 'running') tone(context.currentTime + 0.01 + delay, note, speed)
    },
    close() {
      if (context.state === 'closed') return
      for (const voice of voices) voice.stop()
      void context.close().catch(() => {})
    },
  }
}

export function createStartupSound() {
  const player = createSoundPlayer()
  if (!player) return null
  return {
    async play(elapsed, systemDelay, still) {
      if (!await player.resume()) return
      const position = elapsed()
      if (position < 0.25) {
        powerOn.forEach(note => player.play(note, 0, still ? 0.62 : 1))
      } else {
        player.play([550, 740, 0, 0.20, 0.1])
      }
      if (still) return
      for (const { at, tones } of systemCues) {
        const delta = systemDelay + at - position
        if (delta >= 0) tones.forEach(note => player.play(note, delta))
      }
    },
    close: player.close,
  }
}

// Short press, upward sweep and a chord that resolves as the new page appears.
const portalPress = [[320, 103, 0, 0.073, 0.22], [720, 440, 0.007, 0.05, 0.075]]
const portalOpen = [[285, 605, 0.034, 0.31, 0.084], [432, 864, 0.095, 0.30, 0.055]]
const portalArrival = [[660, 660, 0, 0.23, 0.078], [880, 880, 0.03, 0.27, 0.058], [1100, 1100, 0.06, 0.29, 0.04]]

export function startPortalSound() {
  try {
    const player = createSoundPlayer()
    if (!player) return null
    let closed = false
    const started = performance.now()
    const ready = player.resume().then(running => {
      if (!running || closed || performance.now() - started >= 180) return false
      for (const note of [...portalPress, ...portalOpen]) player.play(note)
      return true
    }).catch(() => false)
    return {
      reveal() {
        void ready.then(playing => {
          if (playing && !closed) portalArrival.forEach(note => player.play(note))
        })
      },
      close() {
        if (closed) return
        closed = true
        player.close()
      },
    }
  } catch {
    return null
  }
}


export const portalActivations = new WeakSet()

export function createPagePressSound() {
  const player = createSoundPlayer()
  if (!player) return null
  return {
    async play() {
      if (await player.resume()) {
        portalPress.forEach(note => player.play(note))
      }
    },
    close: player.close,
  }
}

const focusMelodies = {
  break: [
    [392, 392, 0, 0.76, 0.15],
    [493.88, 493.88, 0.28, 0.70, 0.14],
    [587.33, 587.33, 0.61, 0.79, 0.13],
    [493.88, 493.88, 1.02, 1.02, 0.11],
    [293.66, 293.66, 1.06, 1.16, 0.07],
  ],
  study: [
    [440, 440, 0, 0.82, 0.14],
    [554.37, 554.37, 0.26, 0.78, 0.14],
    [659.25, 659.25, 0.55, 0.87, 0.13],
    [880, 880, 0.92, 0.91, 0.11],
    [659.25, 659.25, 1.30, 1.16, 0.10],
    [329.63, 329.63, 1.30, 1.25, 0.065],
  ],
}

export function createFocusAlarm() {
  try {
    const player = createSoundPlayer()
    if (!player) return null
    // This first resume runs inside the Start timer or break button gesture.
    const ready = player.resume().catch(() => false)
    let closed = false
    let interval
    return {
      ring(kind) {
        void ready.then(running => {
          if (!running || closed || interval) return
          const repeat = () => focusMelodies[kind].forEach(note => player.play(note))
          repeat()
          interval = setInterval(repeat, 3550)
        }).catch(() => {})
      },
      close() {
        if (closed) return
        closed = true
        clearInterval(interval)
        player.close()
      },
    }
  } catch {
    return null
  }
}
