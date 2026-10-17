import test from 'node:test'
import assert from 'node:assert/strict'

import { isDemoSessionToken, resolveDemoAuth } from './demoAuth.js'

test('returns demo passenger payload for the seeded demo credentials', () => {
  const result = resolveDemoAuth({
    email: 'rider.demo@sherides.local',
    password: 'SheRidesDemo2026!',
    role: 'rider',
  })

  assert.ok(result)
  assert.equal(result.user.role, 'rider')
  assert.equal(result.user.isDemo, true)
  assert.match(result.token, /^demo-/)
  assert.equal(result.state.profile.email, 'rider.demo@sherides.local')
})

test('rejects non-demo credentials', () => {
  const result = resolveDemoAuth({
    email: 'someone@example.com',
    password: 'wrong-password',
    role: 'rider',
  })

  assert.equal(result, null)
})

test('detects demo session tokens', () => {
  assert.equal(isDemoSessionToken('demo-rider-session'), true)
  assert.equal(isDemoSessionToken('real-session-token'), false)
})
