import { useState } from 'react'
import { WriteModal } from './WriteModal'
import { emptyDraft } from '../utils/experienceDraft'
import type { ExperienceDraft } from '../utils/experienceDraft'
import { createDraftAiPreviewApi } from './draftAiPreviewApi'
// 실제 글 저장·AI·토큰·브라우저 저장소를 사용하지 않는 개발 전용 미리보기.
export function WriteAiPreview() {
  const params = new URLSearchParams(window.location.search)
  const [draft, setDraft] = useState<ExperienceDraft>(() => params.get('state') === 'empty' ? emptyDraft() : {
    title: '역할을 나누며 공모전을 준비한 경험', resultType: 'SUCCESS', challengeType: 'CONTEST', stage: 'FINAL', factorTags: ['USER_RESEARCH'], goodPoints: '매주 역할과 진행 상황을 공유했어요.', badPoints: '사용자 인터뷰를 늦게 시작했어요.', lessons: '역할을 분명히 정하면 일정 관리가 쉬워져요.', nextPlan: '다음에는 첫 주에 인터뷰를 진행하려고 해요.',
  })
  const [api] = useState(() => createDraftAiPreviewApi(params.get('state') === 'error'))
  const [open, setOpen] = useState(true)
  const [message, setMessage] = useState('')
  return <div className="page-container"><div className="api-banner"><span>글쓰기 AI 미리보기 · 실제 AI나 글 저장을 사용하지 않아요.</span><a href="/#board">서비스 화면</a></div><button className="button button--primary" onClick={() => setOpen(true)}>글쓰기 열기</button>{message && <p role="status">{message}</p>}
    {open && <WriteModal draft={draft} onChange={setDraft} aiApi={api} onClose={() => setOpen(false)} onComplete={async () => { setMessage('미리보기에서 등록 버튼을 확인했어요. 실제 글은 저장하지 않았어요.'); setOpen(false) }} />}
  </div>
}
