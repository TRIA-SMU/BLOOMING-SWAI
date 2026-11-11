import { useState } from 'react'
import { RoadmapPage } from './RoadmapPage'
import type { RoadmapApi, RoadmapResponse } from '../api/roadmap'
import { ApiError } from '../api/client'
import { roadmapChecklistRequest } from '../api/roadmap'

// 개발 전용 미리보기. 실제 AI 호출·계정·체크리스트 데이터를 사용하지 않는다.
export function RoadmapPreview() {
  const [api] = useState<RoadmapApi>(() => {
    const state = new URLSearchParams(window.location.search).get('state')
    const stored = new Map<string, RoadmapResponse>()
    const example: RoadmapResponse = { id: 1, challengeType: 'CONTEST', keep: ['역할과 진행 상황을 매주 공유하기', '사용자 의견을 팀의 결정에 반영하기'], improve: ['중간 점검 일정을 미리 정하기', '제출 전에 요구사항을 다시 확인하기'], tryNew: ['작은 시제품으로 먼저 검증하기', '경험을 한 문장으로 정리하기'], createdAt: '2026-11-11T12:00:00' }
    if (state !== 'empty') stored.set('CONTEST', example)
    let id = 2
    return {
      availability: async () => ({ available: state !== 'shortage', myPostCount: state === 'shortage' ? 1 : 4, needMore: state === 'shortage' ? 2 : 0 }),
      latest: async (type) => { if (state === 'load-error') throw new ApiError(503, '디자인 확인용 조회 오류예요.'); const result = stored.get(type); if (!result) throw new ApiError(404, '아직 만든 로드맵이 없어요'); return result },
      create: async (type, signal) => {
        await new Promise<void>((resolve, reject) => { const timer = setTimeout(resolve, 700); signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }, { once: true }) })
        if (state === 'error') throw new ApiError(503, '디자인 확인용 AI 생성 오류예요.')
        const result = { ...example, id: id++, challengeType: type, createdAt: new Date().toISOString() }; stored.set(type, result); return result
      },
      save: async (type, contents) => {
        if (state === 'save-error') throw new ApiError(503, '디자인 확인용 체크리스트 저장 오류예요.')
        const request = roadmapChecklistRequest(type, contents)
        return { items: request.contents.map((content, index) => ({ id: index + 1, content, done: false, challengeType: type, source: 'ROADMAP' as const })), total: request.contents.length, doneCount: 0 }
      },
    }
  })
  const [version, setVersion] = useState(0)
  return <div className="page-container"><div className="api-banner"><span>로드맵 디자인 미리보기 · 실제 AI나 저장소는 사용하지 않아요.</span><button onClick={() => setVersion((value) => value + 1)}>저장 결과 다시 조회</button><a href="/#roadmap">서비스 화면</a></div>
    <RoadmapPage key={version} authenticated api={api} onLogin={() => {}} onWrite={() => window.location.assign('/#board')} onChecklist={() => window.location.assign('/?preview=checklist')} />
  </div>
}
