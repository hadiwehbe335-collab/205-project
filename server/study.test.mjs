import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createStudyApi } from './api.mjs'
import { openDatabase } from './database.mjs'
import { advance, LEASE_MS } from './study.mjs'

test('three eligible hours minus two focus losses earns 280 points', () => {
  const start = 10_000
  let state = { target: 10_800_000, focused: 0, checked: start, status: 'running' }
  let now = start
  let penalties = 0
  function event(action, gap) {
    now += gap
    const { next, penalty } = advance(state, action, now)
    state = next
    penalties += penalty
  }
  for (let pulse = 0; pulse < 2700; pulse++) {
    if (pulse === 600 || pulse === 1200) {
      event('loss', 1000)
      event('loss', 1000)
      event('resume', 600_000)
    }
    event('pulse', 4000)
  }
  assert.equal(state.status, 'finished')
  assert.equal(state.focused / 36_000 + penalties, 280)
})

test('missing heartbeats earn zero and lease expiry allows resumption', () => {
  const session = { target: 100_000, focused: 4000, checked: 10_000, status: 'running' }
  const expired = 10_000 + LEASE_MS
  assert.equal(advance(session, 'pulse', expired).next.status, 'disconnected')
  const { next, credited, penalty } = advance(session, 'resume', expired)
  assert.equal(next.status, 'running')
  assert.equal(credited, 0)
  assert.equal(penalty, 0)
  assert.equal(advance({ ...session, status: 'paused' }, 'finish', expired).credited, 0)
})

test('server enforces session ownership, replay protection and leaderboard permissions', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'tutorly-test-'))
  const databasePath = join(directory, 'study.sqlite')
  let db = openDatabase(databasePath)
  let time = 100_000
  let api = createStudyApi(db, () => time)
  const server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    db.close()
    rmSync(directory, { recursive: true, force: true })
  })
  const base = `http://127.0.0.1:${server.address().port}/api/study/`
  function client() {
    let cookie = ''
    return async (path, body, status = 200) => {
      const response = await fetch(base + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      cookie = response.headers.get('set-cookie')?.split(';')[0] ?? cookie
      assert.equal(response.status, status, path)
      return response.json()
    }
  }

  const alice = client()
  const bob = client()
  const unauthenticated = client()
  await unauthenticated('leaderboards', undefined, 401)
  const guest = await unauthenticated('guest', {})
  assert.match(guest.handle, /^student_[a-f0-9]{16}$/)
  assert.equal(guest.discoverable, false)
  assert.deepEqual(await unauthenticated('guest', {}), guest)
  assert.equal((await unauthenticated('leaderboards')).friends[0].handle, guest.handle)
  await alice('register', { handle: 'alice', password: 'alice-long-password' })
  await bob('register', { handle: 'bobby', password: 'bobby-long-password' })

  const id = randomUUID()
  const owner = randomUUID()
  const otherTab = randomUUID()
  const start = { id, owner, action: 'start', minutes: 180 }
  await alice('session', start)
  await alice('session', start)
  await alice('session', { ...start, owner: otherTab, id: randomUUID() }, 409)
  await bob('session', { id, owner, action: 'finish', revision: 0 }, 404)
  time += 4000
  await alice('session', { id, owner: otherTab, action: 'pulse', revision: 0 }, 409)
  const pulse = { id, owner, action: 'pulse', revision: 0 }
  assert.equal((await alice('session', pulse)).focused, 4000)
  assert.equal((await alice('session', pulse)).focused, 4000)
  const loss = { id, owner, action: 'loss', revision: 1 }
  assert.equal((await alice('session', loss)).penalties, -10)
  assert.equal((await alice('session', loss)).penalties, -10)
  time += LEASE_MS
  const resumed = await alice('session', { id, owner: otherTab, action: 'resume', revision: 2 })
  assert.equal(resumed.focused, 4000)
  assert.equal(resumed.status, 'running')
  db.close()
  db = openDatabase(databasePath)
  api = createStudyApi(db, () => time)
  time += LEASE_MS
  assert.equal((await alice(`session?owner=${owner}`)).status, 'disconnected')
  assert.equal((await alice('session', { id, owner, action: 'resume', revision: 3 })).status, 'running')
  time += 2000
  await alice('session', { id, owner, action: 'pause', revision: 4 })
  time += 60_000
  await alice('session', { id, owner, action: 'finish', revision: 5 })
  const [summary] = await alice('history')
  assert.equal(summary.focused, 6000)
  assert.equal(summary.penalties, -10)
  assert.equal(summary.status, 'finished')

  assert.equal(await alice('search?handle=bobby'), null)
  await alice('friends', { handle: 'bobby', action: 'add' }, 409)
  await bob('privacy', { discoverable: true, schoolShare: true })
  assert.equal((await bob('me')).schoolShare, false)
  assert.equal((await alice('search?handle=bobby')).handle, 'bobby')
  await alice('friends', { handle: 'bobby', action: 'add' })
  await alice('friends', { handle: 'bobby', action: 'accept' })
  assert.equal((await alice('leaderboards')).friends.length, 1)
  await bob('friends', { handle: 'alice', action: 'accept' })
  assert.equal((await alice('leaderboards')).friends.length, 2)
  await db.execute("UPDATE accounts SET institution='Example University'")
  await bob('privacy', { discoverable: true, schoolShare: true })
  assert.equal((await alice('leaderboards')).school, null)
  await alice('privacy', { discoverable: false, schoolShare: true })
  assert.equal((await alice('leaderboards')).school.length, 2)
  await bob('privacy', { discoverable: false, schoolShare: false })
  assert.equal((await alice('leaderboards')).school.length, 1)
  await alice('friends', { handle: 'bobby', action: 'remove' })
  assert.equal((await bob('leaderboards')).friends.length, 1)
})
