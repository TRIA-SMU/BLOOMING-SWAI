import { apiRequest } from './client.ts'
import type { ChallengeCode, PostSummary } from './posts.ts'
import type { factorLabels } from '../data/writeOptions.ts'
import type { ChecklistResponse } from './checklist.ts'

export type FactorCode = keyof typeof factorLabels
export interface FactorStat { tag: FactorCode; successCount: number; successRate: number; failureCount: number; failureRate: number }
export interface AnalysisResponse {
  totalCount: number; successCount: number; failureCount: number; topFactor: FactorCode | null
  factors: FactorStat[]; relatedPosts: PostSummary[]
}
export interface AnalysisQuery { challengeType: ChallengeCode; keyword: string }
export function analysisPath(query: AnalysisQuery) {
  const params = new URLSearchParams({ challengeType: query.challengeType })
  if (query.keyword.trim()) params.set('keyword', query.keyword.trim())
  return `/api/posts/analysis?${params}`
}
export function insightRequest(challengeType: ChallengeCode, contents: string[]) {
  const cleaned = [...new Set(contents.map((content) => content.trim()))]
  if (!cleaned.length || cleaned.some((content) => !content || content.length > 100)) throw new Error('준비 항목을 1~100자로 입력해 주세요.')
  return { challengeType, source: 'INSIGHT' as const, contents: cleaned }
}
export const analysisApi = {
  get: (query: AnalysisQuery, signal?: AbortSignal) => apiRequest<AnalysisResponse>(analysisPath(query), { signal }),
  saveInsights: (type: ChallengeCode, contents: string[]) => apiRequest<ChecklistResponse>('/api/checklist/bulk', { method: 'POST', body: JSON.stringify(insightRequest(type, contents)) }),
}
