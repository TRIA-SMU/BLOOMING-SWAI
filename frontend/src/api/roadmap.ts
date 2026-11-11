import { apiRequest } from './client.ts'
import { checklistContent } from './checklist.ts'
import type { ChecklistResponse } from './checklist.ts'
import type { ChallengeCode } from './posts.ts'

export interface RoadmapAvailability { available: boolean; myPostCount: number; needMore: number }
export interface RoadmapResponse { id: number; challengeType: ChallengeCode; keep: string[]; improve: string[]; tryNew: string[]; createdAt: string }
export const roadmapCategories = { keep: '유지할 행동', improve: '개선할 행동', tryNew: '새로 시도할 행동' } as const
export type RoadmapCategory = keyof typeof roadmapCategories
export interface RoadmapAction { key: string; category: RoadmapCategory; content: string; selected: boolean; saved: boolean }
export function roadmapActions(result: RoadmapResponse): RoadmapAction[] {
  return (Object.keys(roadmapCategories) as RoadmapCategory[]).flatMap((category) => result[category].map((content, index) => ({ key: `${result.id}-${category}-${index}`, category, content, selected: false, saved: false })))
}
export function roadmapChecklistRequest(challengeType: ChallengeCode, contents: string[]) {
  if (!contents.length) throw new Error('체크리스트에 담을 항목을 골라 주세요.')
  return { challengeType, source: 'ROADMAP' as const, contents: [...new Set(contents.map(checklistContent))] }
}
export const roadmapApi = {
  availability: (signal?: AbortSignal) => apiRequest<RoadmapAvailability>('/api/roadmaps/availability', { signal }),
  latest: (type: ChallengeCode, signal?: AbortSignal) => apiRequest<RoadmapResponse>(`/api/roadmaps/latest?${new URLSearchParams({ challengeType: type })}`, { signal }),
  create: (challengeType: ChallengeCode, signal?: AbortSignal) => apiRequest<RoadmapResponse>('/api/roadmaps', { method: 'POST', body: JSON.stringify({ challengeType }), signal }),
  save: (type: ChallengeCode, contents: string[]) => apiRequest<ChecklistResponse>('/api/checklist/bulk', { method: 'POST', body: JSON.stringify(roadmapChecklistRequest(type, contents)) }),
}
export type RoadmapApi = typeof roadmapApi
