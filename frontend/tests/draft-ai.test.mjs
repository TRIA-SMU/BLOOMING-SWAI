import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { draftAiApi, draftAiRequest, mergeSuggestedTags } from '../src/api/draftAi.ts'
import { emptyDraft } from '../src/utils/experienceDraft.ts'

const originalFetch = globalThis.fetch
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'draft-ai-token', removeItem: () => {} } })
globalThis.window = new EventTarget()
afterEach(() => { globalThis.fetch = originalFetch })

test('잘된 점·아쉬운 점·배운 점 중 하나가 있어야 AI에 요청한다', () => {
  assert.throws(() => draftAiRequest(emptyDraft()))
  assert.throws(() => draftAiRequest({ ...emptyDraft(), nextPlan: '다음 계획만 입력' }))
  for (const key of ['goodPoints', 'badPoints', 'lessons']) assert.doesNotThrow(() => draftAiRequest({ ...emptyDraft(), [key]: '작성 내용' }))
})
test('빈 분류는 null로 보내고 태그·작성자 정보·추가 필드는 AI 요청에서 제외한다', () => {
  const draft = { ...emptyDraft(), title: ' 내 경험 ', goodPoints: ' 역할 공유 ', factorTags: ['USER_RESEARCH'], nickname: '비공개', email: 'private@example.test' }
  const request = draftAiRequest(draft)
  assert.deepEqual(request, { resultType: null, challengeType: null, stage: null, title: '내 경험', goodPoints: '역할 공유', badPoints: '', lessons: '', nextPlan: '' })
  const before = JSON.stringify(request)
  assert.equal(JSON.stringify(draftAiRequest({ ...draft, factorTags: ['ETC'] })), before)
  assert.notEqual(JSON.stringify(draftAiRequest({ ...draft, goodPoints: '변경한 내용' })), before)
})
test('추천 적용은 기존 태그를 보존하고 중복·알 수 없는 코드값을 제외한다', () => {
  const existing = ['USER_RESEARCH']
  assert.deepEqual(mergeSuggestedTags(existing, ['ROLE_DIVISION', 'USER_RESEARCH', 'UNKNOWN', '__proto__']), ['USER_RESEARCH', 'ROLE_DIVISION'])
  assert.deepEqual(existing, ['USER_RESEARCH'])
})
test('AI 요청은 저장 API를 호출하지 않고 토큰과 취소 신호를 전달한다', async () => {
  const controller = new AbortController()
  const result = { summary: '요약', suggestedTags: ['ROLE_DIVISION'], suggestedTagLabels: ['역할 분담'], keyLessons: ['배움'], nextTip: '다음 팁' }
  const calls = []
  globalThis.fetch = async (path, options) => {
    calls.push(path)
    assert.equal(options.method, 'POST'); assert.equal(options.signal, controller.signal)
    assert.equal(options.headers.get('Authorization'), 'Bearer draft-ai-token')
    assert.equal(JSON.parse(options.body).goodPoints, '역할 공유')
    return Response.json(result)
  }
  assert.deepEqual(await draftAiApi.analyze({ ...emptyDraft(), goodPoints: '역할 공유' }, controller.signal), result)
  assert.deepEqual(calls, ['/api/ai/analyze'])
})
test('503과 사용량 제한 429를 성공으로 처리하지 않는다', async () => {
  for (const status of [503, 429]) {
    globalThis.fetch = async () => Response.json({ message: '분석 제한' }, { status })
    await assert.rejects(draftAiApi.analyze({ ...emptyDraft(), lessons: '배운 점' }), { status, message: '분석 제한' })
  }
})
