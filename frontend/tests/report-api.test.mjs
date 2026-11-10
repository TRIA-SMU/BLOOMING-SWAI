import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { buildReportRequest, reportApi } from '../src/api/report.ts'
import { authToken } from '../src/api/client.ts'

const originalFetch = globalThis.fetch
const values = new Map()
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
} })
globalThis.window = new EventTarget()
afterEach(() => { globalThis.fetch = originalFetch; values.clear() })

test('신고 사유를 고르지 않으면 요청을 만들지 않는다', () => {
  assert.throws(() => buildReportRequest('', ''), /사유/)
  assert.throws(() => buildReportRequest('toString', ''), /사유/)
})

test('기타가 아니면 이전에 입력한 설명을 요청에서 제외한다', () => {
  assert.deepEqual(buildReportRequest('SPAM', '다른 사유에 남아 있던 설명'), { reason: 'SPAM' })
})

test('기타 설명은 선택이며 공백을 정리한다', () => {
  assert.deepEqual(buildReportRequest('ETC', '   '), { reason: 'ETC' })
  assert.deepEqual(buildReportRequest('ETC', ' 참고 내용 '), { reason: 'ETC', detail: '참고 내용' })
})

test('기타 설명은 200자까지 허용하고 초과 입력은 거부한다', () => {
  assert.equal(buildReportRequest('ETC', '가'.repeat(200)).detail.length, 200)
  assert.throws(() => buildReportRequest('ETC', '가'.repeat(201)), /200자/)
})

test('영문 신고 사유와 토큰을 POST로 보내고 서버 접수 메시지를 사용한다', async () => {
  authToken.set('valid-token')
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/posts/9/report')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.get('Authorization'), 'Bearer valid-token')
    assert.deepEqual(JSON.parse(options.body), { reason: 'PERSONAL_INFO' })
    return Response.json({ message: '신고가 접수됐어요' })
  }
  assert.equal((await reportApi.submit(9, buildReportRequest('PERSONAL_INFO', ''))).message, '신고가 접수됐어요')
})

test('중복 신고는 409와 서버 안내를 유지하고 자동 재시도하지 않는다', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; return Response.json({ message: '이미 신고한 글이에요' }, { status: 409 }) }
  await assert.rejects(reportApi.submit(9, { reason: 'SPAM' }), (error) => error.status === 409 && error.message === '이미 신고한 글이에요')
  assert.equal(calls, 1)
})

test('일반 서버 오류를 성공으로 처리하지 않는다', async () => {
  globalThis.fetch = async () => Response.json({ message: '잠시 후 다시 시도해 주세요' }, { status: 503 })
  await assert.rejects(reportApi.submit(9, { reason: 'ETC' }), (error) => error.status === 503)
})
