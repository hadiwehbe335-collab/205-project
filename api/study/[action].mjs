import { createStudyApi } from '../../server/api.mjs'

let handler

export default async function study(req, res) {
  try {
    handler ??= createStudyApi()
    const url = new URL(req.url, 'http://localhost')
    const action = url.searchParams.get('action')
    if (url.pathname === '/api/study/[action]' && /^[a-z]+$/.test(action ?? '')) {
      url.pathname = `/api/study/${action}`
      url.searchParams.delete('action')
      req.url = url.pathname + url.search
    }
    return await handler(req, res, () => {
      res.statusCode = 404
      res.end()
    })
  } catch (error) {
    console.error(error)
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ error: 'The hosted study database is unavailable.' }))
  }
}
