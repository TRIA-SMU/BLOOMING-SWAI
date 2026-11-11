import { apiRequest } from './client.ts'
import { checklistContent } from './checklist.ts'
import type { ChecklistResponse } from './checklist.ts'
import type { ChallengeCode } from './posts.ts'

export interface RoadmapAvailability { available: boolean; myPostCount: number; needMore: number }
/** 순서대로 할 단계 하나. phase = 언제 할지 (예: "지원 1주 전") */
export interface RoadmapStep { order: number; phase: string; action: string }
export interface RoadmapResponse { id: number; challengeType: ChallengeCode; keep: string[]; improve: string[]; tryNew: string[]; steps?: RoadmapStep[]; createdAt: string }
export const roadmapCategories = { keep: '지금처럼 이어가기', improve: '아쉬운 점 고치기', tryNew: '새로 해 보기' } as const
export type RoadmapCategory = keyof typeof roadmapCategories
export interface RoadmapAction { key: string; order: number; phase: string; content: string; selected: boolean; saved: boolean }
/** 같은 시점(phase)끼리 묶은 단계. 순서는 처음 나온 순서를 따른다 */
export interface RoadmapPhaseGroup<T extends { phase: string }> { phase: string; items: T[] }

export function roadmapActions(result: RoadmapResponse): RoadmapAction[] {
  const steps: RoadmapStep[] = result.steps?.length
    ? result.steps
    : (Object.keys(roadmapCategories) as RoadmapCategory[]).flatMap((category) => result[category].map((action) => ({ order: 0, phase: roadmapCategories[category], action })))
  return steps.map((step, index) => ({ key: `${result.id}-${index}`, order: index + 1, phase: step.phase, content: step.action, selected: false, saved: false }))
}
export function groupByPhase<T extends { phase: string }>(items: T[]): RoadmapPhaseGroup<T>[] {
  const groups: RoadmapPhaseGroup<T>[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.phase === item.phase) last.items.push(item)
    else groups.push({ phase: item.phase, items: [item] })
  }
  return groups
}
export interface RoadmapChecklistItem { content: string; phase: string; stepOrder: number }
export function roadmapChecklistRequest(challengeType: ChallengeCode, items: RoadmapChecklistItem[]) {
  if (!items.length) throw new Error('체크리스트에 담을 항목을 골라 주세요.')
  const seen = new Set<string>()
  const unique = items.map((item) => ({ ...item, content: checklistContent(item.content) })).filter((item) => !seen.has(item.content) && seen.add(item.content))
  return { challengeType, source: 'ROADMAP' as const, contents: unique.map((item) => item.content), items: unique }
}
export const roadmapApi = {
  availability: (signal?: AbortSignal) => apiRequest<RoadmapAvailability>('/api/roadmaps/availability', { signal }),
  latest: (type: ChallengeCode, signal?: AbortSignal) => apiRequest<RoadmapResponse>(`/api/roadmaps/latest?${new URLSearchParams({ challengeType: type })}`, { signal }),
  create: (challengeType: ChallengeCode, signal?: AbortSignal) => apiRequest<RoadmapResponse>('/api/roadmaps', { method: 'POST', body: JSON.stringify({ challengeType }), signal }),
  save: (type: ChallengeCode, items: RoadmapChecklistItem[]) => apiRequest<ChecklistResponse>('/api/checklist/bulk', { method: 'POST', body: JSON.stringify(roadmapChecklistRequest(type, items)) }),
}
export type RoadmapApi = typeof roadmapApi
