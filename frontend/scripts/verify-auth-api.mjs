// 로컬 H2 개발 계정의 닉네임을 확인한 뒤 반드시 원래 값으로 복구한다.
import assert from 'node:assert/strict'
import { authApi } from '../src/api/auth.ts'
import { postsApi } from '../src/api/posts.ts'

const originalFetch = globalThis.fetch
let userId = 1
globalThis.fetch = (path, options = {}) => {
  const headers = new Headers(options.headers)
  headers.set('X-User-Id', String(userId))
  return originalFetch(`http://127.0.0.1:8080${path}`, { ...options, headers, signal: AbortSignal.timeout(15000) })
}
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()

const original = await postsApi.me()
assert.equal(original.id, 1)
assert.equal(original.nickname, '새벽코딩', '기본 데모 계정이 아니면 값을 변경하지 않는다.')
let changed = false
try {
  const nickname = `검증${String(Date.now()).slice(-6)}`
  const updated = await authApi.changeNickname(nickname)
  changed = true
  assert.equal(updated.nickname, nickname)
  assert.equal((await postsApi.me()).nickname, nickname)
  userId = 2
  const other = await postsApi.me()
  userId = 1
  await assert.rejects(authApi.changeNickname(other.nickname), (error) => error.status === 409)
  await assert.rejects(authApi.changeNickname('가'), (error) => error.status === 400)
  console.log('PASS: 실제 닉네임 변경·재조회, 중복 409, 길이 오류 400')
} finally {
  userId = 1
  if (changed) {
    await authApi.changeNickname(original.nickname)
    console.log('데모 닉네임 원상 복구 완료')
  }
}
