import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { initializeDatabase, openDatabase } from './database.mjs'
import { advance, LEASE_MS } from './study.mjs'

const derive = promisify(scrypt)
const digest = (value) => createHash('sha256').update(value).digest('hex')
const handlePattern = /^[a-z0-9_]{3,24}$/
const idPattern = /^[a-f0-9-]{36}$/
const day = 86_400_000

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
function check(condition, status, message) {
  if (!condition) throw new RequestError(status, message)
}
async function readBody(req) {
  check(req.headers['content-type']?.split(';')[0] === 'application/json', 415, 'Expected JSON.')
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    check(Buffer.byteLength(JSON.stringify(req.body)) <= 4096, 413, 'Request is too large.')
    return req.body
  }
  let body = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? String(req.body) : ''
  check(body.length <= 4096, 413, 'Request is too large.')
  if (!body) for await (const chunk of req) {
    body += chunk
    check(body.length <= 4096, 413, 'Request is too large.')
  }
  try { return JSON.parse(body) ?? {} } catch { throw new RequestError(400, 'Invalid request.') }
}

export function createStudyApi(db = openDatabase(), clock = Date.now) {
  const rows = async (queryable, sql, ...args) => (await queryable.execute({ sql, args })).rows
  const first = async (queryable, sql, ...args) => (await rows(queryable, sql, ...args))[0]
  const get = first.bind(null, db)
  const all = rows.bind(null, db)
  const run = (sql, ...args) => db.execute({ sql, args })
  let schemaReady
  const attempts = new Map()
  let nextCleanup = 0
  async function rateLimit(req, now) {
    if (now > nextCleanup) {
      for (const [key, limit] of attempts) if (limit.until <= now) attempts.delete(key)
      await run('DELETE FROM logins WHERE expires <= ?', now)
      nextCleanup = now + 60_000
    }
    const key = (process.env.VERCEL && req.headers['x-vercel-forwarded-for']) || req.socket.remoteAddress
    const previous = attempts.get(key)
    const limit = previous?.until > now ? previous : { count: 0, until: now + 60_000 }
    check(limit.count < 15, 429, 'Too many account attempts. Try again in a minute.')
    limit.count++
    attempts.set(key, limit)
  }

  async function sessionView(id, owner, now, queryable = db) {
    const session = await first(queryable, "SELECT * FROM sessions WHERE account=? AND status<>'finished'", id)
    if (!session) return null
    const { target, focused, checked, revision } = session
    const expired = session.status === 'running' && now - checked >= LEASE_MS
    return {
      id: session.id, target, focused, revision,
      status: expired ? 'disconnected' : session.status,
      canControl: session.owner === owner || session.status !== 'running' || expired,
      penalties: (await first(queryable, 'SELECT COALESCE(SUM(penalty),0) AS total FROM points WHERE session=?', session.id)).total,
    }
  }

  async function changeSession(account, body, now) {
    const { owner, id, action, revision, minutes } = body
    check(typeof owner === 'string' && idPattern.test(owner) && typeof id === 'string' && idPattern.test(id), 400, 'Invalid session.')
    const transaction = await db.transaction('write')
    const write = (sql, ...args) => transaction.execute({ sql, args })
    try {
      const session = await first(transaction, 'SELECT * FROM sessions WHERE id=? AND account=?', id, account)
      if (action === 'start') {
        check(Number.isInteger(minutes) && minutes >= 1 && minutes <= 180, 400, 'Choose 1 to 180 minutes.')
        if (!session) {
          check(!await first(transaction, "SELECT id FROM sessions WHERE account=? AND status<>'finished'", account), 409, 'A focus session already exists.')
          await write('INSERT INTO sessions (id,account,owner,target,checked) VALUES (?,?,?,?,?)', id, account, owner, minutes * 60_000, now)
        }
      } else {
        check(['pulse', 'pause', 'resume', 'loss', 'finish'].includes(action), 400, 'Unknown timer action.')
        check(session, 404, 'Session unavailable.')
        const expired = now - session.checked >= LEASE_MS
        if (session.status !== 'finished' && revision === session.revision) {
          const takeover = ['resume', 'finish'].includes(action) && (session.status !== 'running' || expired)
          check(session.owner === owner || takeover, 409, 'The timer is running in another tab.')
          const applicable = action === 'resume'
            ? session.status !== 'running' || expired
            : session.status === 'running' || action === 'finish'
          if (applicable) {
            const { next, credited, penalty } = advance(session, action, now)
            const nextRevision = revision + 1
            await write('UPDATE sessions SET owner=?, focused=?, checked=?, status=?, revision=? WHERE id=?',
              takeover ? owner : session.owner, next.focused, next.checked, next.status, nextRevision, id)
            if (credited || penalty) await write('INSERT INTO points VALUES (?,?,?,?,?)', id, nextRevision, now, credited, penalty)
          }
        }
      }
      const result = await sessionView(account, owner, now, transaction)
      await transaction.commit()
      return result
    } finally {
      transaction.close()
    }
  }

  function rankings(where, ...parameters) {
    return all(`
      SELECT a.handle, COALESCE(SUM(p.credited),0) AS focused, COALESCE(SUM(p.penalty),0) AS penalties
      FROM accounts a LEFT JOIN sessions s ON s.account=a.id LEFT JOIN points p ON p.session=s.id
      WHERE ${where} GROUP BY a.id ORDER BY focused + penalties * 36000 DESC, a.handle LIMIT 100
    `, ...parameters)
  }

  return async function studyApi(req, res, next) {
    const url = new URL(req.url, 'http://localhost')
    if (!url.pathname.startsWith('/api/study/')) return next()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    const path = url.pathname.slice('/api/study/'.length)
    const token = req.headers.cookie?.match(/(?:^|; )tutorly_study=([a-f0-9]{64})(?:;|$)/)?.[1]
    const secure = process.env.VERCEL || req.socket.encrypted || process.env.TUTORLY_SECURE_COOKIE === '1'
    const cookie = (value, maxAge) => res.setHeader('Set-Cookie',
      `tutorly_study=${value}; Path=/api/study; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`)
    try {
      schemaReady ??= initializeDatabase(db).catch((error) => {
        schemaReady = undefined
        throw error
      })
      await schemaReady
      const now = clock()
      const post = req.method === 'POST'
      check(post || req.method === 'GET', 405, 'Method unavailable.')
      if (post) {
        const origin = req.headers.origin
        check(req.headers['sec-fetch-site'] !== 'cross-site' &&
          (!origin || origin === `http://${req.headers.host}` || origin === `https://${req.headers.host}`),
          403, 'Cross-origin request.')
      }
      const body = post ? await readBody(req) : {}
      const account = token && await get(`SELECT a.id, a.handle, a.institution, a.discoverable, a.school_share
        FROM logins l JOIN accounts a ON a.id=l.account WHERE l.token=? AND l.expires>?`, digest(token), now)
      let result
      if (post && path === 'guest') {
        let profile = account
        if (!profile) {
          await rateLimit(req, now)
          const id = randomUUID()
          const handle = `student_${randomBytes(8).toString('hex')}`
          await run('INSERT INTO accounts (id,handle,salt,secret) VALUES (?,?,?,?)',
            id, handle, randomBytes(16).toString('hex'), randomBytes(64).toString('hex'))
          const login = randomBytes(32).toString('hex')
          const lifetime = 365
          await run('INSERT INTO logins VALUES (?,?,?)', digest(login), id, now + lifetime * day)
          cookie(login, lifetime * 86400)
          profile = { handle, institution: null, discoverable: 0, school_share: 0 }
        }
        result = {
          handle: profile.handle, institution: profile.institution,
          discoverable: Boolean(profile.discoverable), schoolShare: Boolean(profile.school_share),
        }
      } else if (post && ['register', 'login'].includes(path)) {
        await rateLimit(req, now)
        const handle = typeof body.handle === 'string' ? body.handle.trim().toLowerCase() : ''
        const { password } = body
        check(handlePattern.test(handle) && typeof password === 'string' && password.length >= 12 && password.length <= 128,
          400, 'Use a 3–24 character username and a 12–128 character password.')
        const existing = await get('SELECT * FROM accounts WHERE handle=?', handle)
        const salt = existing?.salt ?? randomBytes(16).toString('hex')
        const secret = await derive(password, salt, 64)
        let id = existing?.id
        if (path === 'register') {
          id = randomUUID()
          check((await run('INSERT OR IGNORE INTO accounts (id,handle,salt,secret) VALUES (?,?,?,?)',
            id, handle, salt, secret.toString('hex'))).rowsAffected, 409, 'Username unavailable.')
        } else {
          check(existing && timingSafeEqual(Buffer.from(existing.secret, 'hex'), secret), 401, 'Username or password is incorrect.')
        }
        if (token) await run('DELETE FROM logins WHERE token=?', digest(token))
        const login = randomBytes(32).toString('hex')
        await run('INSERT INTO logins VALUES (?,?,?)', digest(login), id, now + 30 * day)
        cookie(login, 30 * 86400)
        result = { handle }
      } else if (!post && path === 'me') {
        result = account ? {
          handle: account.handle, institution: account.institution,
          discoverable: Boolean(account.discoverable), schoolShare: Boolean(account.school_share),
        } : null
      } else {
        check(account, 401, 'Open Focus Mode or Leaderboards to restore your study profile.')
        const id = account.id
        if (post && path === 'logout') {
          await run('DELETE FROM logins WHERE token=?', digest(token))
          cookie('', 0)
          result = {}
        } else if (path === 'session') {
          result = post ? await changeSession(id, body, clock()) : await sessionView(id, url.searchParams.get('owner'), now)
        } else if (post && path === 'privacy') {
          await run('UPDATE accounts SET discoverable=?, school_share=? WHERE id=?',
            Number(body.discoverable === true), Number(Boolean(account.institution) && body.schoolShare === true), id)
          result = {}
        } else if (!post && path === 'search') {
          const handle = (url.searchParams.get('handle') ?? '').trim().toLowerCase()
          const match = handlePattern.test(handle) && await get('SELECT handle FROM accounts WHERE discoverable=1 AND handle=? AND id<>?', handle, id)
          result = match || null
        } else if (path === 'friends') {
          if (post) {
            check(typeof body.handle === 'string' && handlePattern.test(body.handle), 400, 'Invalid username.')
            const peer = await get('SELECT id FROM accounts WHERE handle=? AND id<>?', body.handle, id)
            check(peer, 404, 'User unavailable.')
            const [low, high] = [id, peer.id].sort()
            if (body.action === 'add') {
              const inserted = await run(`INSERT OR IGNORE INTO friends (low,high,sender)
                SELECT ?,?,? FROM accounts WHERE id=? AND discoverable=1
                AND (SELECT COUNT(*) FROM friends WHERE sender=? AND accepted=0)<30`, low, high, id, peer.id, id)
              check(inserted.rowsAffected || await get('SELECT 1 FROM friends WHERE low=? AND high=?', low, high), 409, 'Request unavailable or pending request limit reached.')
            } else if (body.action === 'accept') {
              await run('UPDATE friends SET accepted=1 WHERE low=? AND high=? AND sender<>?', low, high, id)
            } else if (body.action === 'remove') {
              await run('DELETE FROM friends WHERE low=? AND high=?', low, high)
            } else check(false, 400, 'Unknown friend action.')
          }
          result = await all(`SELECT p.handle, f.accepted, f.sender=? AS outgoing
            FROM friends f JOIN accounts p ON p.id=CASE WHEN f.low=? THEN f.high ELSE f.low END
            WHERE f.low=? OR f.high=? ORDER BY p.handle`, id, id, id, id)
        } else if (!post && path === 'leaderboards') {
          result = {
            friends: await rankings(`a.id=? OR a.id IN (
              SELECT CASE WHEN low=? THEN high ELSE low END FROM friends WHERE accepted=1 AND (low=? OR high=?)
            )`, id, id, id, id),
            school: account.institution && account.school_share
              ? await rankings('a.institution=? AND a.school_share=1', account.institution) : null,
          }
        } else if (!post && path === 'history') {
          result = await all(`SELECT s.id, s.target, s.status, s.checked,
            COALESCE(SUM(p.credited),0) AS focused, COALESCE(SUM(p.penalty),0) AS penalties
            FROM sessions s LEFT JOIN points p ON p.session=s.id WHERE s.account=?
            GROUP BY s.id ORDER BY s.checked DESC LIMIT 20`, id)
        } else check(false, 404, 'Study endpoint unavailable.')
      }
      res.end(JSON.stringify(result))
    } catch (error) {
      res.statusCode = error.status || 500
      if (!error.status) console.error(error)
      res.end(JSON.stringify({ error: error.status ? error.message : 'Study service unavailable.' }))
    }
  }
}

export function studyApiPlugin() {
  function configure(server) { server.middlewares.use(createStudyApi()) }
  return { name: 'mytutorly-study-api', configureServer: configure, configurePreviewServer: configure }
}
