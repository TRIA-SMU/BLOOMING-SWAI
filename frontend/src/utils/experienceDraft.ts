import { challengeLabels, factorLabels, resultLabels, stageLabels } from '../data/writeOptions.ts'
import type { Experience } from '../types/experience'

export interface ExperienceDraft {
  title: string
  resultType: keyof typeof resultLabels | ''
  challengeType: keyof typeof challengeLabels | ''
  stage: keyof typeof stageLabels | ''
  factorTags: (keyof typeof factorLabels)[]
  goodPoints: string
  badPoints: string
  lessons: string
  nextPlan: string
}
export type DraftErrors = Partial<Record<keyof ExperienceDraft, string>>

export function emptyDraft(): ExperienceDraft {
  return { title: '', resultType: '', challengeType: '', stage: '', factorTags: [], goodPoints: '', badPoints: '', lessons: '', nextPlan: '' }
}

export function validateDraft(draft: ExperienceDraft): DraftErrors {
  const errors: DraftErrors = {}
  if (!draft.title.trim()) errors.title = '제목을 입력해 주세요.'
  else if (draft.title.length > 100) errors.title = '제목은 100자 이내로 입력해 주세요.'
  if (!draft.resultType) errors.resultType = '결과를 골라 주세요.'
  if (!draft.challengeType) errors.challengeType = '도전 유형을 골라 주세요.'
  if (!draft.stage) errors.stage = '진행 단계를 골라 주세요.'
  if (!draft.factorTags.length) errors.factorTags = '요인 태그를 1개 이상 골라 주세요.'
  // 시안의 배운 점 필수 정책. 서버 검증 강화 여부는 팀 합의 후 연동 시 확인한다.
  if (!draft.lessons.trim()) errors.lessons = '배운 점을 입력해 주세요.'
  return errors
}

export function createDemoExperience(draft: ExperienceDraft, id: number, now = new Date()): Experience {
  if (Object.keys(validateDraft(draft)).length) throw new Error('필수 항목을 확인해 주세요.')
  const date = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}.`
  return {
    id, title: draft.title.trim(), result: resultLabels[draft.resultType as keyof typeof resultLabels],
    type: challengeLabels[draft.challengeType as keyof typeof challengeLabels],
    stage: stageLabels[draft.stage as keyof typeof stageLabels],
    tags: draft.factorTags.map((tag) => factorLabels[tag]),
    preview: draft.lessons.trim(), nickname: '새벽코딩', date, helpful: 0, growth: '씨앗',
    content: { good: draft.goodPoints.trim(), regret: draft.badPoints.trim(), learned: draft.lessons.trim(), next: draft.nextPlan.trim() },
  }
}
