import { useState } from 'react'
import { MyPage } from './MyPage'
import type { MyPageApi } from '../api/mypage'
import type { PostDetail } from '../api/posts'
import { toCreateRequest } from '../api/posts'
import { validateDraft } from '../utils/experienceDraft'
import { ApiError } from '../api/client'
import { createDraftAiPreviewApi } from './draftAiPreviewApi'

// 개발 전용 미리보기: 실제 로그인 정보나 API를 사용하지 않는다.
export function MyPagePreview() {
  const [aiApi] = useState(() => createDraftAiPreviewApi())
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState('')
  const [api] = useState<MyPageApi>(() => {
    const state = new URLSearchParams(window.location.search).get('state')
    let posts: PostDetail[] = state === 'empty' ? [] : [
      { id: 1, authorId: 1, authorNickname: '새벽코딩', resultType: 'SUCCESS', challengeType: 'CONTEST', stage: 'FINAL', title: '역할을 나누고 끝까지 완주한 공모전', factorTags: ['ROLE_DIVISION', 'SCHEDULE_MANAGEMENT'], helpfulCount: 12, growthStage: 'BUD', status: 'PUBLIC', createdAt: '2026-11-11T10:00:00', goodPoints: '주마다 역할과 진행 상황을 공유했어요.', badPoints: '사용자 인터뷰를 늦게 시작했어요.', lessons: '역할을 분명히 정하면 일정 관리가 쉬워져요.', nextPlan: '첫 주에 인터뷰를 시작하려고 해요.' },
      { id: 2, authorId: 1, authorNickname: '새벽코딩', resultType: 'FAILURE', challengeType: 'INTERN', stage: 'INTERVIEW', title: '면접에서 배운 경험 정리의 중요성', factorTags: ['LACK_OF_PREP'], helpfulCount: 3, growthStage: 'SPROUT', status: 'PUBLIC', createdAt: '2026-11-10T10:00:00', goodPoints: null, badPoints: '경험을 짧게 설명하기 어려웠어요.', lessons: '경험의 핵심을 먼저 정리해야 해요.', nextPlan: null },
      { id: 3, authorId: 1, authorNickname: '새벽코딩', resultType: 'STOPPED', challengeType: 'PROJECT', stage: 'ETC', title: '다음에 다시 이어가고 싶은 프로젝트', factorTags: ['ETC'], helpfulCount: 0, growthStage: 'SEED', status: 'HIDDEN', createdAt: '2026-11-09T10:00:00', goodPoints: null, badPoints: null, lessons: '일정을 먼저 합의해야 해요.', nextPlan: null },
    ]
    const find = (id: number) => { const post = posts.find((item) => item.id === id); if (!post) throw new ApiError(404, '글을 찾을 수 없어요.'); return post }
    const fail = () => { if (state === 'error') throw new ApiError(503, '디자인 확인용 저장 오류예요.') }
    return {
      get: async () => { if (state === 'load-error') throw new ApiError(503, '디자인 확인용 조회 오류예요.'); return { nickname: '새벽코딩', helpedCount: posts.reduce((sum, post) => sum + post.helpfulCount, 0), posts: [...posts] } },
      detail: async (id) => ({ ...find(id), factorTags: [...find(id).factorTags] }),
      update: async (id, draft) => { fail(); if (Object.keys(validateDraft(draft)).length) throw new Error('필수 항목을 확인해 주세요.'); const post = { ...find(id), ...toCreateRequest(draft) } as PostDetail; posts = posts.map((item) => item.id === id ? post : item); return post },
      remove: async (id) => { fail(); find(id); posts = posts.filter((post) => post.id !== id) },
    }
  })
  return <div className="page-container"><div className="api-banner"><span>마이페이지 디자인 미리보기 · 실제 계정과 글은 변경하지 않아요.</span><a href="/#mypage">서비스 화면</a></div>
    {notice && <div className="api-banner" role="status">{notice}</div>}
    <MyPage authenticated userId={1} refreshKey={refreshKey} api={api} aiApi={aiApi} onChanged={() => setRefreshKey((value) => value + 1)}
      onLogin={() => {}} onNickname={() => window.location.assign('/?preview=nickname')} onDetail={() => setNotice('상세 화면은 로그인 후 서비스에서 확인할 수 있어요.')} onWrite={() => setNotice('새 글은 로그인 후 서비스에서 작성할 수 있어요.')} onChecklist={() => window.location.assign('/?preview=checklist')} onRoadmap={() => window.location.assign('/?preview=roadmap')} />
  </div>
}
