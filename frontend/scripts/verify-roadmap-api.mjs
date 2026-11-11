// 로컬 개발 서버의 데모 사용자로 조회·제한·설정 오류를 확인한다. 체크리스트 검증 항목만 생성 후 삭제한다.
import assert from 'node:assert/strict'
import { roadmapApi } from '../src/api/roadmap.ts'
import { checklistApi } from '../src/api/checklist.ts'

const originalFetch = globalThis.fetch
let userId = 1
globalThis.fetch = (path, options = {}) => originalFetch(`http://127.0.0.1:8080${path}`, {
  ...options, headers: new Headers({ ...Object.fromEntries(new Headers(options.headers)), 'X-User-Id': String(userId) }), signal: AbortSignal.timeout(15000),
})
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()
const content = `로드맵 검증 ${Date.now()} 일정 확인하기`
try {
  const availability = await roadmapApi.availability()
  assert.equal(availability.available, availability.myPostCount >= 3)
  assert.equal(availability.needMore, Math.max(0, 3 - availability.myPostCount))
  try { const latest = await roadmapApi.latest('CONTEST'); assert.ok(latest.id); assert.ok(Array.isArray(latest.keep)) }
  catch (error) { assert.equal(error.status, 404) }
  userId = 4
  const insufficient = await roadmapApi.availability()
  assert.equal(insufficient.available, false)
  await assert.rejects(roadmapApi.create('CONTEST'), (error) => error.status === 400)
  userId = 1
  // AI 키가 없는 로컬 환경에서만 명시적 옵션으로 설정 오류 응답을 확인한다.
  if (process.argv.includes('--check-missing-key')) {
    assert.ok(availability.available)
    await assert.rejects(roadmapApi.create('CONTEST'), (error) => error.status === 503 && /application-secret/.test(error.message))
  }
  const saved = await roadmapApi.save('CONTEST', [content])
  const item = saved.items.find((item) => item.content === content)
  assert.ok(item); assert.equal(item.source, 'ROADMAP'); assert.equal(item.done, false)
  console.log('PASS: 생성 조건·최근 결과 조회·3건 미만 생성 제한·ROADMAP 체크리스트 저장')
} finally {
  userId = 1
  const mine = await checklistApi.list()
  for (const item of mine.items.filter((entry) => entry.content === content)) await checklistApi.remove(item.id)
  console.log('검증용 체크리스트 정리 완료')
}
