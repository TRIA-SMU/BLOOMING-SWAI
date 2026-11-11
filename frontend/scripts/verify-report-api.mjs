// 이 스크립트가 생성한 로컬 테스트 글만 신고하고 마지막에 삭제한다.
import assert from 'node:assert/strict'
import { apiRequest } from '../src/api/client.ts'
import { postsApi } from '../src/api/posts.ts'
import { reportApi } from '../src/api/report.ts'

const originalFetch = globalThis.fetch
let userId = 1
globalThis.fetch = (path, options = {}) => {
  const headers = new Headers(options.headers)
  headers.set('X-User-Id', String(userId))
  return originalFetch(`http://127.0.0.1:8080${path}`, { ...options, headers, signal: AbortSignal.timeout(15000) })
}
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()
let createdId
const title = `신고 연동 검증 ${Date.now()}`
try {
  const me = await postsApi.me()
  assert.equal(me.id, 1)
  const post = await postsApi.create({ title, resultType: 'SUCCESS', challengeType: 'PROJECT', stage: 'FINAL', factorTags: ['ETC'], goodPoints: '', badPoints: '', lessons: '신고 연동 확인용 기록', nextPlan: '' })
  assert.equal(post.authorId, me.id)
  assert.equal(post.title, title)
  createdId = post.id
  await assert.rejects(reportApi.submit(createdId, { reason: 'SPAM' }), (error) => error.status === 400)
  userId = 2
  await assert.rejects(reportApi.submit(createdId, { reason: 'ETC', detail: '가'.repeat(201) }), (error) => error.status === 400)
  assert.match((await reportApi.submit(createdId, { reason: 'ETC', detail: '검증용 상세 내용' })).message, /접수/)
  await assert.rejects(reportApi.submit(createdId, { reason: 'SPAM' }), (error) => error.status === 409)
  userId = 3
  await reportApi.submit(createdId, { reason: 'PERSONAL_INFO' })
  userId = 4
  await reportApi.submit(createdId, { reason: 'DEFAMATION' })
  userId = 1
  assert.equal((await postsApi.detail(createdId)).status, 'HIDDEN')
  const page = await postsApi.list({ resultType: 'SUCCESS', keyword: title, sort: 'latest', page: 0 })
  assert.equal(page.totalElements, 0)
  userId = 2
  await assert.rejects(postsApi.detail(createdId), (error) => error.status === 404)
  console.log('PASS: 내 글 제한, 200자 검증, 정상 접수, 중복 409, 3건 누적 숨김 및 조회 제한')
} finally {
  userId = 1
  if (createdId != null) {
    await apiRequest(`/api/posts/${createdId}`, { method: 'DELETE' })
    console.log('신고 검증용 게시글과 연결 데이터 정리 완료')
  }
}
