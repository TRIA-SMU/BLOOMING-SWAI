// 로컬 개발 백엔드만 사용하고, 이 스크립트가 만든 항목만 정리한다.
import assert from 'node:assert/strict'
import { checklistApi } from '../src/api/checklist.ts'

const originalFetch = globalThis.fetch
let userId = 1
globalThis.fetch = (path, options = {}) => originalFetch(`http://127.0.0.1:8080${path}`, {
  ...options, headers: new Headers({ ...Object.fromEntries(new Headers(options.headers)), 'X-User-Id': String(userId) }), signal: AbortSignal.timeout(15000),
})
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()
let createdId
try {
  const item = await checklistApi.create(`체크리스트 검증 ${Date.now()}`, 'CONTEST')
  createdId = item.id
  assert.equal(item.source, 'CUSTOM'); assert.equal(item.done, false)
  assert.ok((await checklistApi.list(undefined, 'CONTEST')).items.some((entry) => entry.id === createdId))
  const done = await checklistApi.update(createdId, { done: true })
  assert.equal(done.done, true)
  const content = `${item.content} 수정`
  const edited = await checklistApi.update(createdId, { content })
  assert.equal(edited.done, true); assert.equal(edited.content, content)
  userId = 2
  assert.ok(!(await checklistApi.list()).items.some((entry) => entry.id === createdId))
  await assert.rejects(checklistApi.update(createdId, { done: false }), (error) => error.status === 404)
  await assert.rejects(checklistApi.remove(createdId), (error) => error.status === 404)
  userId = 1
  assert.equal((await checklistApi.update(createdId, { done: false })).done, false)
  console.log('PASS: 조회·추가·내용 수정·완료/취소·다른 사용자 조회 및 변경 제한')
} finally {
  userId = 1
  if (createdId != null) {
    await checklistApi.remove(createdId)
    assert.ok(!(await checklistApi.list()).items.some((entry) => entry.id === createdId))
    console.log('검증용 체크리스트 삭제 및 재조회 확인 완료')
  }
}
