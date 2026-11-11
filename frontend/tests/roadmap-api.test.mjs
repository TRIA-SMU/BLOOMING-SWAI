import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { roadmapActions, roadmapApi, roadmapChecklistRequest } from '../src/api/roadmap.ts'

const originalFetch = globalThis.fetch
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'roadmap-token', removeItem: () => {} } })
globalThis.window = new EventTarget()
afterEach(() => { globalThis.fetch = originalFetch })
const roadmap = { id: 4, challengeType: 'CONTEST', keep: ['역할 나누기'], improve: ['일정 점검하기'], tryNew: ['시제품 검증하기'], createdAt: '2026-11-11T12:00:00' }

test('로드맵은 서버의 세 분류를 유지하고 원본 문장을 변경하지 않는다', () => {
  const actions = roadmapActions(roadmap)
  assert.deepEqual(actions.map((item) => item.category), ['keep', 'improve', 'tryNew'])
  assert.equal(new Set(actions.map((item) => item.key)).size, 3)
  assert.ok(actions.every((item) => !item.selected && !item.saved))
  actions[0].content = '수정한 문장'
  assert.deepEqual(roadmap.keep, ['역할 나누기'])
})
test('생성 가능 여부와 최근 로드맵은 GET으로만 조회한다', async () => {
  const controller = new AbortController()
  const paths = []
  globalThis.fetch = async (path, options) => {
    paths.push(path); assert.equal(options.method, undefined); assert.equal(options.signal, controller.signal)
    return Response.json(path.endsWith('availability') ? { available: false, myPostCount: 1, needMore: 2 } : roadmap)
  }
  assert.equal((await roadmapApi.availability(controller.signal)).needMore, 2)
  assert.equal((await roadmapApi.latest('CONTEST', controller.signal)).id, 4)
  assert.deepEqual(paths, ['/api/roadmaps/availability', '/api/roadmaps/latest?challengeType=CONTEST'])
})
test('생성 POST는 도전 유형과 토큰만 보내고 서버의 저장 ID를 사용한다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/roadmaps'); assert.equal(options.method, 'POST')
    assert.equal(options.headers.get('Authorization'), 'Bearer roadmap-token')
    assert.deepEqual(JSON.parse(options.body), { challengeType: 'CONTEST' })
    return Response.json(roadmap)
  }
  assert.deepEqual(await roadmapApi.create('CONTEST'), roadmap)
})
test('저장 결과 없음과 AI 서비스 실패 상태를 구분한다', async () => {
  globalThis.fetch = async () => Response.json({ message: '아직 만든 로드맵이 없어요' }, { status: 404 })
  await assert.rejects(roadmapApi.latest('CONTEST'), { status: 404 })
  globalThis.fetch = async () => Response.json({ message: 'AI 분석이 잠시 안 돼요' }, { status: 503 })
  await assert.rejects(roadmapApi.create('CONTEST'), { status: 503, message: 'AI 분석이 잠시 안 돼요' })
})
test('선택한 수정 문장만 ROADMAP 출처로 담고 100자 제한을 지킨다', async () => {
  assert.deepEqual(roadmapChecklistRequest('JOB', [' 일정 확인하기 ', '일정 확인하기']), { challengeType: 'JOB', source: 'ROADMAP', contents: ['일정 확인하기'] })
  for (const values of [[], [' '], ['가'.repeat(101)]]) assert.throws(() => roadmapChecklistRequest('JOB', values))
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/checklist/bulk'); assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), { challengeType: 'JOB', source: 'ROADMAP', contents: ['수정한 행동'] })
    return Response.json({ items: [], total: 1, doneCount: 0 })
  }
  assert.equal((await roadmapApi.save('JOB', ['수정한 행동'])).total, 1)
})
