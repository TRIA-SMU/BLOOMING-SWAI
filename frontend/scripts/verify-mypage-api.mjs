// 로컬 개발 백엔드에서 이 스크립트가 작성한 글만 수정·신고·삭제한다.
import assert from 'node:assert/strict'
import { mypageApi, postToDraft } from '../src/api/mypage.ts'
import { postsApi } from '../src/api/posts.ts'
import { reportApi } from '../src/api/report.ts'

const originalFetch = globalThis.fetch
let userId = 1
globalThis.fetch = (path, options = {}) => originalFetch(`http://127.0.0.1:8080${path}`, {
  ...options, headers: new Headers({ ...Object.fromEntries(new Headers(options.headers)), 'X-User-Id': String(userId) }), signal: AbortSignal.timeout(15000),
})
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()
let createdId
try {
  const title = `내 글 관리 검증 ${Date.now()}`
  const post = await postsApi.create({ title, resultType: 'SUCCESS', challengeType: 'CONTEST', stage: 'FINAL', factorTags: ['ROLE_DIVISION'], goodPoints: '역할 공유', badPoints: '', lessons: '역할을 먼저 정하기', nextPlan: '' })
  createdId = post.id
  assert.ok((await mypageApi.get()).posts.some((item) => item.id === createdId))
  const draft = postToDraft(await mypageApi.detail(createdId))
  assert.equal(draft.goodPoints, '역할 공유')
  userId = 2
  await postsApi.setHelpful(createdId, true)
  await assert.rejects(mypageApi.update(createdId, draft), (error) => error.status === 403)
  await assert.rejects(mypageApi.remove(createdId), (error) => error.status === 403)
  assert.ok(!(await mypageApi.get()).posts.some((item) => item.id === createdId))
  userId = 1
  const changed = await mypageApi.update(createdId, { ...draft, resultType: 'FAILURE', title: `${title} 수정`, factorTags: ['SCHEDULE_MANAGEMENT'] })
  assert.equal(changed.resultType, 'FAILURE'); assert.deepEqual(changed.factorTags, ['SCHEDULE_MANAGEMENT']); assert.equal(changed.helpfulCount, 1)
  assert.equal((await postsApi.list({ resultType: 'SUCCESS', keyword: title, sort: 'latest', page: 0 })).totalElements, 0)
  assert.equal((await postsApi.list({ resultType: 'FAILURE', keyword: title, sort: 'latest', page: 0 })).totalElements, 1)
  for (const reporter of [2, 3, 4]) { userId = reporter; await reportApi.submit(createdId, { reason: 'ETC', detail: '로컬 검증용 신고' }) }
  userId = 1
  assert.equal((await mypageApi.get()).posts.find((item) => item.id === createdId).status, 'HIDDEN')
  const hidden = await mypageApi.detail(createdId)
  assert.equal(hidden.status, 'HIDDEN')
  const editedHidden = await mypageApi.update(createdId, { ...postToDraft(hidden), lessons: '검토 중 글 수정 확인' })
  assert.equal(editedHidden.status, 'HIDDEN'); assert.equal(editedHidden.helpfulCount, 1)
  console.log('PASS: 내 글 조회·기존 내용 불러오기·수정·게시판 이동·반응 유지·검토 중 표시·타인 변경 거부')
} finally {
  userId = 1
  if (createdId != null) {
    await mypageApi.remove(createdId)
    assert.ok(!(await mypageApi.get()).posts.some((item) => item.id === createdId))
    await assert.rejects(mypageApi.detail(createdId), (error) => error.status === 404)
    console.log('검증용 글·연결된 반응·신고 삭제 및 내 글 재조회 확인 완료')
  }
}
