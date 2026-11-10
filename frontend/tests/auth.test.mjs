import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { authToken } from '../src/api/client.ts'
import { apiRequest } from '../src/api/client.ts'
import { authApi, clearSession, consumeOAuthCallback, finishNickname, needsNickname, validateNickname } from '../src/api/auth.ts'

const values = new Map()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
} })
globalThis.window = new EventTarget()
const originalFetch = globalThis.fetch
afterEach(() => { values.clear(); globalThis.fetch = originalFetch })

test('홈페이지의 token 쿼리는 로그인 콜백으로 취급하지 않는다', () => {
  const result = consumeOAuthCallback('http://localhost:5173/?token=unexpected', () => { throw new Error('주소 변경 금지') })
  assert.equal(result.callback, false)
  assert.equal(authToken.get(), null)
})

test('첫 가입 콜백은 주소에서 토큰을 먼저 제거하고 닉네임 설정을 유지한다', () => {
  let cleanUrl
  consumeOAuthCallback('http://localhost:5173/oauth/callback?token=test-token&newUser=true', (url) => {
    assert.equal(authToken.get(), null)
    cleanUrl = url
  })
  assert.equal(cleanUrl, '/')
  assert.equal(authToken.get(), 'test-token')
  assert.equal(needsNickname(), true)
  finishNickname()
  assert.equal(needsNickname(), false)
})

test('기존 회원 콜백은 이전 닉네임 설정 대기를 해제한다', () => {
  consumeOAuthCallback('http://localhost:5173/oauth/callback?token=old&newUser=true', () => {})
  consumeOAuthCallback('http://localhost:5173/oauth/callback?token=current&newUser=false', () => {})
  assert.equal(authToken.get(), 'current')
  assert.equal(needsNickname(), false)
})

test('로그인 실패는 기존 세션을 지우고 URL에서 오류 쿼리를 제거한다', () => {
  authToken.set('old')
  let cleanUrl
  const result = consumeOAuthCallback('http://localhost:5173/oauth/callback?error=login_failed', (url) => { cleanUrl = url })
  assert.equal(cleanUrl, '/')
  assert.match(result.error, /다시 시도/)
  assert.equal(authToken.get(), null)
})

test('이메일 미제공 및 토큰 누락 콜백을 실패로 처리한다', () => {
  assert.match(consumeOAuthCallback('http://localhost:5173/oauth/callback?error=no_email', () => {}).error, /이메일/)
  assert.ok(consumeOAuthCallback('http://localhost:5173/oauth/callback?newUser=true', () => {}).error)
  assert.equal(needsNickname(), false)
})

test('로그아웃은 토큰과 닉네임 설정 대기를 함께 제거한다', () => {
  consumeOAuthCallback('http://localhost:5173/oauth/callback?token=demo&newUser=true', () => {})
  clearSession()
  assert.equal(authToken.get(), null)
  assert.equal(needsNickname(), false)
})

test('닉네임은 공백을 제거한 뒤 2~12자 조건을 검사한다', () => {
  assert.ok(validateNickname('   '))
  assert.ok(validateNickname('가'))
  assert.equal(validateNickname(' 두글 '), '')
  assert.equal(validateNickname('가'.repeat(12)), '')
  assert.ok(validateNickname('가'.repeat(13)))
})

test('닉네임 저장은 토큰과 공백 제거한 이름을 보내고 실제 응답을 반환한다', async () => {
  authToken.set('valid')
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/me/nickname')
    assert.equal(options.method, 'PATCH')
    assert.equal(options.headers.get('Authorization'), 'Bearer valid')
    assert.deepEqual(JSON.parse(options.body), { nickname: '새로운이름' })
    return Response.json({ id: 5, nickname: '새로운이름' })
  }
  assert.equal((await authApi.changeNickname(' 새로운이름 ')).nickname, '새로운이름')
})

test('닉네임 중복 오류 메시지는 사용자에게 표시할 수 있게 유지한다', async () => {
  globalThis.fetch = async () => Response.json({ message: '이미 사용 중인 닉네임이에요' }, { status: 409 })
  await assert.rejects(authApi.changeNickname('도토리'), (error) => error.status === 409 && error.message === '이미 사용 중인 닉네임이에요')
})

test('이전 토큰의 늦은 401 응답은 새 로그인 토큰을 삭제하지 않는다', async () => {
  authToken.set('old')
  globalThis.fetch = async () => {
    authToken.set('new')
    return Response.json({ message: '이전 토큰 만료' }, { status: 401 })
  }
  await assert.rejects(apiRequest('/api/me'))
  assert.equal(authToken.get(), 'new')
})
