export const LEASE_MS = 12_000

export function advance(session, action, now) {
  const elapsed = Math.max(0, now - session.checked)
  const next = { ...session, checked: Math.max(session.checked, now) }
  let credited = 0
  let penalty = 0
  if (session.status === 'running') {
    if (elapsed >= LEASE_MS) next.status = 'disconnected'
    else if (['pulse', 'pause', 'finish'].includes(action)) {
      credited = Math.min(elapsed, session.target - session.focused)
    }
    if (action === 'loss') {
      penalty = -10
      next.status = 'interrupted'
    }
  }
  next.focused += credited
  if (action === 'resume' && next.status !== 'running') next.status = 'running'
  if (action === 'pause' && next.status === 'running') next.status = 'paused'
  if (action === 'finish' || next.focused === next.target) next.status = 'finished'
  return { next, credited, penalty }
}
