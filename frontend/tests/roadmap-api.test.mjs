import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { groupByPhase, roadmapActions, roadmapApi, roadmapChecklistRequest } from '../src/api/roadmap.ts'

const originalFetch = globalThis.fetch
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'roadmap-token', removeItem: () => {} } })
globalThis.window = new EventTarget()
afterEach(() => { globalThis.fetch = originalFetch })
const roadmap = { id: 4, challengeType: 'CONTEST', keep: ['역할 나누기'], improve: ['일정 점검하기'], tryNew: ['시제품 검증하기'], createdAt: '2026-11-11T12:00:00' }

test('단계가 없는 예전 로드맵은 유지 → 개선 → 시도 순서로 단계를 만들고 원본 문장을 변경하지 않는다', () => {
  const actions = roadmapActions(roadmap)
  assert.deepEqual(actions.map((item) => item.order), [1, 2, 3])
  assert.deepEqual(actions.map((item) => item.phase), ['지금처럼 이어가기', '아쉬운 점 고치기', '새로 해 보기'])
  assert.equal(new Set(actions.map((item) => item.key)).size, 3)
  assert.ok(actions.every((item) => !item.selected && !item.saved))
  actions[0].content = '수정한 문장'
  assert.deepEqual(roadmap.keep, ['역할 나누기'])
})
test('서버가 준 단계 순서와 시점을 그대로 쓰고 같은 시점끼리 묶는다', () => {
  const actions = roadmapActions({ ...roadmap, steps: [{ order: 1, phase: '지원 2주 전', action: '공고 확인하기' }, { order: 2, phase: '지원 2주 전', action: '이력서 쓰기' }, { order: 3, phase: '면접 전', action: '답변 연습하기' }] })
  assert.deepEqual(actions.map((item) => item.content), ['공고 확인하기', '이력서 쓰기', '답변 연습하기'])
  assert.deepEqual(groupByPhase(actions).map((group) => [group.phase, group.items.length]), [['지원 2주 전', 2], ['면접 전', 1]])
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
test('선택한 수정 문장만 단계 정보와 함께 ROADMAP 출처로 담고 100자 제한을 지킨다', async () => {
  const step = (content, stepOrder = 1) => ({ content, phase: '시작 전', stepOrder })
  assert.deepEqual(roadmapChecklistRequest('JOB', [step(' 일정 확인하기 '), step('일정 확인하기', 2)]), { challengeType: 'JOB', source: 'ROADMAP', contents: ['일정 확인하기'], items: [step('일정 확인하기')] })
  for (const values of [[], [step(' ')], [step('가'.repeat(101))]]) assert.throws(() => roadmapChecklistRequest('JOB', values))
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/checklist/bulk'); assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), { challengeType: 'JOB', source: 'ROADMAP', contents: ['수정한 행동'], items: [step('수정한 행동')] })
    return Response.json({ items: [], total: 1, doneCount: 0 })
  }
  assert.equal((await roadmapApi.save('JOB', [step('수정한 행동')])).total, 1)
})
