import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { ApiError, apiRequest, authToken } from '../src/api/client.ts'
import { detailToExperience, listPath, postsApi, summaryToExperience } from '../src/api/posts.ts'

const storage = new Map()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} })
globalThis.window = new EventTarget()
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch; storage.clear() })

const summary = {
  id: 8, authorNickname: '도토리', resultType: 'FAILURE', challengeType: 'CONTEST', stage: 'DOCUMENT',
  title: '첫 도전', factorTags: ['USER_RESEARCH'], helpfulCount: 4, growthStage: 'SPROUT', createdAt: '2026-11-11T23:00:00',
}

test('검색어의 특수문자를 보존하고 전체 필터를 서버에 보내지 않는다', () => {
  const url = new URL(listPath({ resultType: 'FAILURE', keyword: ' A&B + 면접 ', sort: 'helpful', page: 2 }), 'http://localhost')
  assert.equal(url.searchParams.get('keyword'), 'A&B + 면접')
  assert.equal(url.searchParams.get('page'), '2')
  assert.equal(url.searchParams.get('sort'), 'helpful')
  assert.equal(url.searchParams.has('challengeType'), false)
})

test('목록은 서버의 성장 단계를 사용하고 없는 본문을 만들어내지 않는다', () => {
  const item = summaryToExperience(summary)
  assert.equal(item.result, '실패')
  assert.equal(item.growth, '싹')
  assert.equal(item.preview, '')
  assert.equal(item.helpful, 4)
})

test('상세의 null 서술형은 빈 문자열로 처리하고 소유자·숨김 상태를 보존한다', () => {
  const item = detailToExperience({ ...summary, authorId: 2, status: 'HIDDEN', goodPoints: null, badPoints: '', lessons: '배운 점', nextPlan: null })
  assert.equal(item.authorId, 2)
  assert.equal(item.status, 'HIDDEN')
  assert.equal(item.content.good, '')
  assert.equal(item.content.learned, '배운 점')
})

test('등록은 영문 enum과 태그를 보내고 응답의 서버 ID를 사용한다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/posts')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.get('Content-Type'), 'application/json')
    assert.equal(options.headers.has('X-User-Id'), false)
    const body = JSON.parse(options.body)
    assert.equal(body.resultType, 'FAILURE')
    assert.deepEqual(body.factorTags, ['USER_RESEARCH'])
    assert.equal(body.title, '첫 도전')
    return Response.json({ ...summary, id: 99 }, { status: 201 })
  }
  const post = await postsApi.create({ title: ' 첫 도전 ', resultType: 'FAILURE', challengeType: 'CONTEST', stage: 'DOCUMENT', factorTags: ['USER_RESEARCH'], goodPoints: '', badPoints: '', lessons: '배움', nextPlan: '' })
  assert.equal(post.id, 99)
})

test('페이지 응답은 content 외 totalPages·number·totalElements도 유지한다', async () => {
  globalThis.fetch = async () => Response.json({ content: [summary], totalPages: 3, number: 1, totalElements: 22 })
  const page = await postsApi.list({ resultType: 'FAILURE', page: 1, sort: 'latest' })
  assert.equal(page.totalElements, 22)
  assert.equal(page.totalPages, 3)
  assert.equal(page.number, 1)
})

test('토큰을 첨부하고 401이면 제거한 뒤 로그인 안내 이벤트를 발행한다', async () => {
  authToken.set('expired')
  let notified = false
  window.addEventListener('blooming:unauthorized', () => { notified = true }, { once: true })
  globalThis.fetch = async (_path, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer expired')
    return Response.json({ message: '로그인이 만료됐어요' }, { status: 401 })
  }
  await assert.rejects(postsApi.me(), (error) => error instanceof ApiError && error.status === 401 && error.message === '로그인이 만료됐어요')
  assert.equal(authToken.get(), null)
  assert.equal(notified, true)
})

test('반응 취소 DELETE도 응답의 최신 건수와 성장 단계를 반환한다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/posts/8/helpful')
    assert.equal(options.method, 'DELETE')
    assert.equal(options.body, undefined)
    return Response.json({ postId: 8, helped: false, helpfulCount: 2, growthStage: 'SEED', growthLabel: '씨앗' })
  }
  assert.equal((await postsApi.setHelpful(8, false)).helpfulCount, 2)
})

test('오류 응답과 연결 장애를 구분하고 204는 JSON 파싱하지 않는다', async () => {
  globalThis.fetch = async () => Response.json({ message: '제목은 100자 이내예요' }, { status: 400 })
  await assert.rejects(apiRequest('/api/posts'), (error) => error.status === 400 && error.message === '제목은 100자 이내예요')
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(apiRequest('/api/me'), (error) => error.status === 0)
  globalThis.fetch = async () => new Response(null, { status: 204 })
  assert.equal(await apiRequest('/api/posts/8', { method: 'DELETE' }), undefined)
})
