// 로컬 H2에서 분석을 조회하고, 이 스크립트가 만든 체크리스트 항목만 정리한다.
import assert from 'node:assert/strict'
import { analysisApi } from '../src/api/analysis.ts'
import { apiRequest } from '../src/api/client.ts'

const originalFetch = globalThis.fetch
globalThis.fetch = (path, options = {}) => originalFetch(`http://127.0.0.1:8080${path}`, {
  ...options, headers: new Headers({ ...Object.fromEntries(new Headers(options.headers)), 'X-User-Id': '1' }), signal: AbortSignal.timeout(15000),
})
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()
const marker = `분석검증-${Date.now()}`
const contents = [`${marker} 일정 확인하기`, `${marker} 역할 확인하기`]
try {
  const data = await analysisApi.get({ challengeType: 'CONTEST', keyword: '' })
  assert.equal(data.totalCount, data.successCount + data.failureCount)
  for (const factor of data.factors) {
    assert.equal(factor.successRate, data.successCount ? Math.round(factor.successCount * 100 / data.successCount) : 0)
    assert.equal(factor.failureRate, data.failureCount ? Math.round(factor.failureCount * 100 / data.failureCount) : 0)
  }
  assert.ok(data.relatedPosts.length <= 3)
  const empty = await analysisApi.get({ challengeType: 'CONTEST', keyword: marker })
  assert.equal(empty.totalCount, 0)
  assert.equal(empty.topFactor, null)
  const saved = await analysisApi.saveInsights('CONTEST', contents)
  const created = saved.items.filter((item) => contents.includes(item.content))
  assert.equal(created.length, 2)
  assert.ok(created.every((item) => item.source === 'INSIGHT' && !item.done && item.challengeType === 'CONTEST'))
  console.log('PASS: 실제 분석 건수·비율, 대표 3개, 검색 0건, INSIGHT 체크리스트 저장')
} finally {
  const mine = await apiRequest('/api/checklist')
  for (const item of mine.items.filter((item) => contents.includes(item.content))) await apiRequest(`/api/checklist/${item.id}`, { method: 'DELETE' })
  console.log('검증용 체크리스트 항목 정리 완료')
}
