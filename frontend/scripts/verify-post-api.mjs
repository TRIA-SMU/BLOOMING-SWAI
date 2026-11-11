// 로컬 개발 서버 전용 통합 확인. 이 스크립트가 만든 게시글만 마지막에 삭제한다.
import assert from 'node:assert/strict'
import { apiRequest } from '../src/api/client.ts'
import { detailToExperience, postsApi } from '../src/api/posts.ts'

const originalFetch = globalThis.fetch
let testUserId = 1
globalThis.fetch = (path, options = {}) => {
  const headers = new Headers(options.headers)
  headers.set('X-User-Id', String(testUserId))
  return originalFetch(`http://127.0.0.1:8080${path}`, { ...options, headers, signal: AbortSignal.timeout(15000) })
}
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()

let createdId
const title = `프론트 연동 확인 ${Date.now()}`
try {
  const me = await postsApi.me()
  assert.equal(me.id, 1)
  const initial = await postsApi.list({ resultType: 'SUCCESS', page: 0, size: 2, sort: 'latest' })
  assert.ok(Array.isArray(initial.content))
  assert.ok(initial.content.length <= 2)
  const draft = { title, resultType: 'FAILURE', challengeType: 'CONTEST', stage: 'DOCUMENT', factorTags: ['USER_RESEARCH'], goodPoints: '', badPoints: '', lessons: 'API 연결을 확인했어요.', nextPlan: '' }
  const created = await postsApi.create(draft)
  assert.equal(created.authorId, me.id)
  assert.equal(created.title, title)
  createdId = created.id
  const detail = await postsApi.detail(createdId)
  assert.equal(detailToExperience(detail).content.learned, draft.lessons)
  const matches = await postsApi.list({ resultType: 'FAILURE', challengeType: 'CONTEST', keyword: title, page: 0, sort: 'latest' })
  assert.equal(matches.totalElements, 1)
  assert.equal(matches.content[0].id, createdId)
  const empty = await postsApi.list({ resultType: 'SUCCESS', keyword: title, page: 0, sort: 'latest' })
  assert.equal(empty.totalElements, 0)
  await assert.rejects(postsApi.setHelpful(createdId, true), (error) => error.status === 400)
  testUserId = 2
  assert.equal((await postsApi.me()).id, 2)
  assert.equal((await postsApi.helpful(createdId)).helped, false)
  const added = await postsApi.setHelpful(createdId, true)
  assert.equal(added.helped, true)
  assert.equal(added.helpfulCount, 1)
  const cancelled = await postsApi.setHelpful(createdId, false)
  assert.equal(cancelled.helped, false)
  assert.equal(cancelled.helpfulCount, 0)
  console.log('PASS: 내 정보, 서버 페이지·검색·필터, 등록·상세 재조회, 내 글 반응 제한, 타 사용자 반응 추가·취소')
} finally {
  testUserId = 1
  if (createdId != null) {
    await apiRequest(`/api/posts/${createdId}`, { method: 'DELETE' })
    console.log('통합 확인용 게시글 삭제 완료')
  }
}
