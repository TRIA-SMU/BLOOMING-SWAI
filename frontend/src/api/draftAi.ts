import { apiRequest } from './client.ts'
import { factorLabels } from '../data/writeOptions.ts'
import type { ExperienceDraft } from '../utils/experienceDraft.ts'

export type SuggestedTag = keyof typeof factorLabels
export interface DraftAiResponse { summary: string; suggestedTags: SuggestedTag[]; suggestedTagLabels: string[]; keyLessons: string[]; nextTip: string }
export function draftAiRequest(draft: ExperienceDraft) {
  if (![draft.goodPoints, draft.badPoints, draft.lessons].some((value) => value.trim())) throw new Error('잘된 점·아쉬운 점·배운 점 중 하나를 먼저 적어 주세요.')
  return {
    resultType: draft.resultType || null, challengeType: draft.challengeType || null, stage: draft.stage || null,
    title: draft.title.trim(), goodPoints: draft.goodPoints.trim(), badPoints: draft.badPoints.trim(),
    lessons: draft.lessons.trim(), nextPlan: draft.nextPlan.trim(),
  }
}
export function mergeSuggestedTags(existing: SuggestedTag[], selected: readonly string[]): SuggestedTag[] {
  return [...new Set([...existing, ...selected.filter((tag): tag is SuggestedTag => Object.hasOwn(factorLabels, tag))])]
}
export const draftAiApi = {
  analyze: (draft: ExperienceDraft, signal?: AbortSignal) => apiRequest<DraftAiResponse>('/api/ai/analyze', { method: 'POST', body: JSON.stringify(draftAiRequest(draft)), signal }),
}
export type DraftAiApi = typeof draftAiApi
