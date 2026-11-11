import type { DraftAiApi } from '../api/draftAi'
import { ApiError } from '../api/client'

export function createDraftAiPreviewApi(error = false): DraftAiApi {
  return { analyze: async (_draft, signal) => {
    await new Promise<void>((resolve, reject) => { const timer = setTimeout(resolve, 700); signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }, { once: true }) })
    if (error) throw new ApiError(503, 'AI 키가 설정되지 않았어요')
    return { summary: '역할 공유가 일정 관리에 도움이 된 경험이에요.', suggestedTags: ['ROLE_DIVISION', 'SCHEDULE_MANAGEMENT'], suggestedTagLabels: ['역할 분담', '일정 관리'], keyLessons: ['팀원의 역할을 먼저 정하기', '중간 점검 일정을 미리 잡기'], nextTip: '다음 도전에서는 첫 주에 사용자 인터뷰를 시작해 보세요.' }
  } }
}
