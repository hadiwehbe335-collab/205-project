const key = 'mytutorly.transition-sound'
let enabled = true

export function readTransitionSound() {
  try {
    const saved = sessionStorage.getItem(key)
    if (saved !== null) return saved === 'on'
  } catch { /* Keep the preference in memory when storage is disabled. */ }
  return enabled
}

export function writeTransitionSound(value) {
  enabled = value
  try { sessionStorage.setItem(key, value ? 'on' : 'off') } catch { /* In-memory preference still applies. */ }
}
