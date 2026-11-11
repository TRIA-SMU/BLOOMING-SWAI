import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { mypageApi, postToDraft } from '../src/api/mypage.ts'

const originalFetch = globalThis.fetch
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'mypage-token', removeItem: () => {} } })
globalThis.window = new EventTarget()
afterEach(() => { globalThis.fetch = originalFetch })
const post = { id: 8, authorId: 1, title: '내 경험', resultType: 'SUCCESS', challengeType: 'PROJECT', stage: 'FINAL', factorTags: ['ROLE_DIVISION'], goodPoints: null, badPoints: '', lessons: '배운 점', nextPlan: null, helpfulCount: 12, growthStage: 'BUD', status: 'HIDDEN' }

test('수정 폼은 기존 분류와 서술형을 불러오고 원본 태그 배열을 변경하지 않는다', () => {
  const draft = postToDraft(post)
  assert.deepEqual(draft, { title: '내 경험', resultType: 'SUCCESS', challengeType: 'PROJECT', stage: 'FINAL', factorTags: ['ROLE_DIVISION'], goodPoints: '', badPoints: '', lessons: '배운 점', nextPlan: '', prepPeriod: '', applyField: '' })
  draft.factorTags.push('ETC')
  assert.deepEqual(post.factorTags, ['ROLE_DIVISION'])
})
test('내 글 조회는 숨김 상태와 서버의 받은 도움 수를 유지한다', async () => {
  const controller = new AbortController()
  const data = { nickname: '새벽코딩', helpedCount: 12, posts: [post] }
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/posts/me'); assert.equal(options.signal, controller.signal)
    assert.equal(options.headers.get('Authorization'), 'Bearer mypage-token')
    return Response.json(data)
  }
  assert.deepEqual(await mypageApi.get(controller.signal), data)
})
test('수정은 PUT으로 정리한 폼만 보내고 반응·성장·숨김 상태를 덮어쓰지 않는다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/posts/8'); assert.equal(options.method, 'PUT')
    const body = JSON.parse(options.body)
    assert.equal(body.title, '수정 제목'); assert.equal(body.resultType, 'FAILURE')
    for (const key of ['authorId', 'helpfulCount', 'growthStage', 'status']) assert.equal(key in body, false)
    return Response.json({ ...post, ...body })
  }
  const updated = await mypageApi.update(8, { ...postToDraft(post), title: ' 수정 제목 ', resultType: 'FAILURE' })
  assert.equal(updated.helpfulCount, 12); assert.equal(updated.growthStage, 'BUD'); assert.equal(updated.status, 'HIDDEN')
})
test('삭제 성공 204와 타인 글 수정 거부를 구분한다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/posts/8'); assert.equal(options.method, 'DELETE')
    return new Response(null, { status: 204 })
  }
  assert.equal(await mypageApi.remove(8), undefined)
  globalThis.fetch = async () => Response.json({ message: '내 글만 수정할 수 있어요' }, { status: 403 })
  await assert.rejects(mypageApi.update(8, postToDraft(post)), { status: 403, message: '내 글만 수정할 수 있어요' })
})
