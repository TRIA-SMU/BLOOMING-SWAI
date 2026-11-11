import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { checklistApi, checklistContent, checklistPath } from '../src/api/checklist.ts'

const originalFetch = globalThis.fetch
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'checklist-token', removeItem: () => {} } })
globalThis.window = new EventTarget()
afterEach(() => { globalThis.fetch = originalFetch })

test('전체 및 유형별 체크리스트를 조회한다', async () => {
  assert.equal(checklistPath(), '/api/checklist')
  assert.equal(checklistPath('CONTEST'), '/api/checklist?challengeType=CONTEST')
  const controller = new AbortController()
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/checklist')
    assert.equal(options.signal, controller.signal)
    assert.equal(options.headers.get('Authorization'), 'Bearer checklist-token')
    return Response.json({ items: [], total: 0, doneCount: 0 })
  }
  assert.deepEqual(await checklistApi.list(controller.signal), { items: [], total: 0, doneCount: 0 })
})
test('공백을 정리하고 100자 제한을 적용한다', () => {
  assert.equal(checklistContent(' 준비하기 '), '준비하기')
  assert.equal(checklistContent('가'.repeat(100)).length, 100)
  assert.throws(() => checklistContent(' '))
  assert.throws(() => checklistContent('가'.repeat(101)))
})
test('직접 추가는 CUSTOM 출처와 유형을 전송한다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/checklist')
    assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), { content: '일정 점검하기', challengeType: null, source: 'CUSTOM' })
    return Response.json({ id: 8, content: '일정 점검하기', done: false, challengeType: null, source: 'CUSTOM' })
  }
  assert.equal((await checklistApi.create(' 일정 점검하기 ', null)).id, 8)
})
test('완료 체크와 내용 수정은 PATCH에서 다른 필드를 덮어쓰지 않는다', async () => {
  const bodies = []
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/checklist/8'); assert.equal(options.method, 'PATCH')
    bodies.push(JSON.parse(options.body))
    return Response.json({ id: 8, content: '확인하기', done: true, source: 'INSIGHT', challengeType: 'JOB' })
  }
  await checklistApi.update(8, { done: false })
  await checklistApi.update(8, { content: ' 확인하기 ' })
  assert.deepEqual(bodies, [{ done: false }, { content: '확인하기' }])
})
test('삭제 204와 소유권 오류를 그대로 처리한다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/checklist/8'); assert.equal(options.method, 'DELETE')
    return new Response(null, { status: 204 })
  }
  assert.equal(await checklistApi.remove(8), undefined)
  globalThis.fetch = async () => Response.json({ message: '항목을 찾을 수 없어요' }, { status: 404 })
  await assert.rejects(checklistApi.update(8, { done: true }), { status: 404, message: '항목을 찾을 수 없어요' })
})
