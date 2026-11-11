// 로컬 데모 사용자로 입력 검증·AI 키 미설정 응답을 확인한다. 게시글은 생성하지 않는다.
import assert from 'node:assert/strict'
import { draftAiApi } from '../src/api/draftAi.ts'
import { apiRequest } from '../src/api/client.ts'
import { mypageApi } from '../src/api/mypage.ts'
import { emptyDraft } from '../src/utils/experienceDraft.ts'

const originalFetch = globalThis.fetch
globalThis.fetch = (path, options = {}) => originalFetch(`http://127.0.0.1:8080${path}`, {
  ...options, headers: new Headers({ ...Object.fromEntries(new Headers(options.headers)), 'X-User-Id': '1' }), signal: AbortSignal.timeout(15000),
})
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, removeItem: () => {} } })
globalThis.window = new EventTarget()
const before = (await mypageApi.get()).posts.map((post) => post.id)
await assert.rejects(apiRequest('/api/ai/analyze', { method: 'POST', body: JSON.stringify({}) }), (error) => error.status === 400)
if (process.argv.includes('--check-missing-key')) {
  await assert.rejects(draftAiApi.analyze({ ...emptyDraft(), goodPoints: '검증용 역할 분담 경험' }), (error) => error.status === 503 && /application-secret/.test(error.message))
}
assert.deepEqual((await mypageApi.get()).posts.map((post) => post.id), before)
console.log('PASS: AI 입력 검증·키 미설정 응답·글이 저장되지 않음 확인')
