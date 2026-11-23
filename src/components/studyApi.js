export async function studyRequest(path, body, keepalive = false) {
  const response = await fetch(`/api/study/${path}`, body === undefined ? { signal: AbortSignal.timeout(8000) } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), keepalive, signal: AbortSignal.timeout(8000),
  })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The study service is unavailable.')
  }
  const result = await response.json()
  if (!response.ok) {
    const error = new Error(result.error)
    error.status = response.status
    throw error
  }
  return result
}

export const studyPoints = ({ focused, penalties = 0 }) => focused / 36_000 + penalties
export const pointText = (points) => points.toLocaleString(undefined, { maximumFractionDigits: 2 })
export function clockText(milliseconds) {
  const seconds = Math.ceil(milliseconds / 1000)
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0')).join(':')
}
