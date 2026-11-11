import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { analysisApi, analysisPath, insightRequest } from '../src/api/analysis.ts'

const originalFetch = globalThis.fetch
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'test-token', removeItem: () => {} } })
globalThis.window = new EventTarget()
afterEach(() => { globalThis.fetch = originalFetch })

test('분석 검색어를 URL 인코딩하고 지원하지 않는 필터를 보내지 않는다', () => {
  const url = new URL(analysisPath({ challengeType: 'CONTEST', keyword: ' A&B + 조사 ' }), 'http://localhost')
  assert.equal(url.searchParams.get('challengeType'), 'CONTEST')
  assert.equal(url.searchParams.get('keyword'), 'A&B + 조사')
  assert.equal(url.searchParams.size, 2)
  assert.equal(analysisPath({ challengeType: 'JOB', keyword: ' ' }), '/api/posts/analysis?challengeType=JOB')
})
test('수정한 준비 문장을 정리하고 INSIGHT 출처로 저장한다', () => {
  assert.deepEqual(insightRequest('INTERN', [' 조사하기 ', '조사하기', '일정 점검하기']), { challengeType: 'INTERN', source: 'INSIGHT', contents: ['조사하기', '일정 점검하기'] })
  for (const contents of [[], [' '], ['가'.repeat(101)]]) assert.throws(() => insightRequest('ETC', contents))
  assert.equal(insightRequest('ETC', ['가'.repeat(100)]).contents[0].length, 100)
})
test('분석은 서버의 0건과 null 최다 요인을 그대로 유지하고 취소 신호를 전달한다', async () => {
  const controller = new AbortController()
  const empty = { totalCount: 0, successCount: 0, failureCount: 0, topFactor: null, factors: [], relatedPosts: [] }
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/posts/analysis?challengeType=PROJECT')
    assert.equal(options.signal, controller.signal)
    return Response.json(empty)
  }
  assert.deepEqual(await analysisApi.get({ challengeType: 'PROJECT', keyword: '' }, controller.signal), empty)
})
test('체크리스트 저장은 토큰과 선택한 문장만 보내고 서버 오류를 유지한다', async () => {
  globalThis.fetch = async (path, options) => {
    assert.equal(path, '/api/checklist/bulk')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token')
    assert.deepEqual(JSON.parse(options.body), { challengeType: 'JOB', source: 'INSIGHT', contents: ['면접 일정 점검하기'] })
    return Response.json({ message: '저장 실패' }, { status: 503 })
  }
  await assert.rejects(analysisApi.saveInsights('JOB', ['면접 일정 점검하기']), { status: 503, message: '저장 실패' })
})
