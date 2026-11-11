import { useState } from 'react'
import { ChecklistPage } from './ChecklistPage'
import type { ChecklistApi, ChecklistItem } from '../api/checklist'
import { checklistContent } from '../api/checklist'
import { ApiError } from '../api/client'

// main.tsx의 DEV 분기에서만 렌더링한다. 토큰·실제 API·저장소를 사용하지 않는다.
export function ChecklistPreview() {
  const [version, setVersion] = useState(0)
  const [api] = useState<ChecklistApi>(() => {
    let nextId = 5
    let items: ChecklistItem[] = new URLSearchParams(window.location.search).get('state') === 'empty' ? [] : [
      { id: 1, content: '모집 요강과 지원 일정 확인하기', done: true, source: 'INSIGHT', challengeType: 'CONTEST' },
      { id: 2, content: '마감 전 중간 점검 일정 정하기', done: false, source: 'INSIGHT', challengeType: 'CONTEST' },
      { id: 3, content: '팀원의 역할과 책임 정하기', done: false, source: 'ROADMAP', challengeType: 'PROJECT' },
      { id: 4, content: '이번 주 준비 일정 확인하기', done: false, source: 'CUSTOM', challengeType: null },
    ]
    const fail = () => { if (new URLSearchParams(window.location.search).get('state') === 'error') throw new ApiError(503, '디자인 확인용 저장 오류예요. 입력한 내용은 유지돼요.') }
    return {
      list: async () => ({ items: [...items], total: items.length, doneCount: items.filter((item) => item.done).length }),
      create: async (content, challengeType) => { fail(); const item: ChecklistItem = { id: nextId++, content: checklistContent(content), done: false, source: 'CUSTOM', challengeType }; items = [...items, item]; return item },
      update: async (id, values) => { fail(); const existing = items.find((item) => item.id === id); if (!existing) throw new Error('항목을 찾을 수 없어요.'); const item = { ...existing, ...values, ...(values.content == null ? {} : { content: checklistContent(values.content) }) }; items = items.map((entry) => entry.id === id ? item : entry); return item },
      remove: async (id) => { fail(); items = items.filter((item) => item.id !== id) },
    }
  })
  return <div className="page-container"><div className="api-banner"><span>체크리스트 디자인 미리보기 · 실제 계정과 데이터는 변경하지 않아요.</span><button onClick={() => setVersion((value) => value + 1)}>저장 상태 다시 조회</button><a href="/#checklist">서비스 화면</a></div>
    <ChecklistPage key={version} authenticated api={api} onLogin={() => {}} onAnalysis={() => window.location.assign('/#analysis')} />
  </div>
}
