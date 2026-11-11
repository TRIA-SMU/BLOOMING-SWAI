import { apiRequest } from './client.ts'
import type { ChallengeCode } from './posts.ts'

export interface ChecklistItem { id: number; content: string; done: boolean; source: 'INSIGHT' | 'ROADMAP' | 'CUSTOM'; challengeType: ChallengeCode | null }
export interface ChecklistResponse { items: ChecklistItem[]; total: number; doneCount: number }
export function checklistPath(type?: ChallengeCode) {
  return `/api/checklist${type ? `?${new URLSearchParams({ challengeType: type })}` : ''}`
}
export function checklistContent(content: string) {
  const value = content.trim()
  if (!value || value.length > 100) throw new Error('준비 항목을 1~100자로 입력해 주세요.')
  return value
}
export const checklistApi = {
  list: (signal?: AbortSignal, type?: ChallengeCode) => apiRequest<ChecklistResponse>(checklistPath(type), { signal }),
  create: (content: string, challengeType: ChallengeCode | null) => apiRequest<ChecklistItem>('/api/checklist', { method: 'POST', body: JSON.stringify({ content: checklistContent(content), challengeType, source: 'CUSTOM' }) }),
  update: (id: number, values: { content?: string; done?: boolean }) => apiRequest<ChecklistItem>(`/api/checklist/${id}`, { method: 'PATCH', body: JSON.stringify({ ...values, ...(values.content === undefined ? {} : { content: checklistContent(values.content) }) }) }),
  remove: (id: number) => apiRequest<void>(`/api/checklist/${id}`, { method: 'DELETE' }),
}
export type ChecklistApi = typeof checklistApi
