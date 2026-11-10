import { apiRequest } from './client.ts'
import { challengeLabels, factorLabels, resultLabels, stageLabels } from '../data/writeOptions.ts'
import type { Experience, Growth } from '../types/experience'
import type { ExperienceDraft } from '../utils/experienceDraft'

export type ResultCode = keyof typeof resultLabels
export type ChallengeCode = keyof typeof challengeLabels
export type GrowthCode = 'SEED' | 'SPROUT' | 'BUD' | 'FLOWER'
const growthLabels: Record<GrowthCode, Growth> = { SEED: '씨앗', SPROUT: '싹', BUD: '봉우리', FLOWER: '꽃' }

export interface PostSummary {
  id: number
  authorNickname: string
  resultType: ResultCode
  challengeType: ChallengeCode
  stage: keyof typeof stageLabels
  title: string
  factorTags: (keyof typeof factorLabels)[]
  helpfulCount: number
  growthStage: GrowthCode
  createdAt: string
}
export interface PostDetail extends PostSummary {
  authorId: number
  status: 'PUBLIC' | 'HIDDEN'
  goodPoints: string | null
  badPoints: string | null
  lessons: string | null
  nextPlan: string | null
}
export interface PostPage {
  content: PostSummary[]
  totalElements: number
  totalPages: number
  number: number
}
export interface ListQuery {
  resultType: ResultCode
  challengeType?: ChallengeCode
  keyword?: string
  sort: 'latest' | 'helpful'
  page: number
  size?: number
}
export interface HelpfulResponse {
  postId: number
  helped: boolean
  helpfulCount: number
  growthStage: GrowthCode
  growthLabel: string
}
export interface Me { id: number; nickname: string }

export function listPath(query: ListQuery) {
  const params = new URLSearchParams({ resultType: query.resultType, sort: query.sort, page: String(query.page), size: String(query.size ?? 10) })
  if (query.challengeType) params.set('challengeType', query.challengeType)
  if (query.keyword?.trim()) params.set('keyword', query.keyword.trim())
  return `/api/posts?${params}`
}

export function toCreateRequest(draft: ExperienceDraft) {
  return { ...draft, title: draft.title.trim(), goodPoints: draft.goodPoints.trim(), badPoints: draft.badPoints.trim(), lessons: draft.lessons.trim(), nextPlan: draft.nextPlan.trim() }
}

export function summaryToExperience(post: PostSummary): Experience {
  return {
    id: post.id, title: post.title, result: resultLabels[post.resultType], type: challengeLabels[post.challengeType],
    stage: stageLabels[post.stage], tags: post.factorTags.map((tag) => factorLabels[tag]), nickname: post.authorNickname,
    date: `${post.createdAt.slice(0, 4)}. ${post.createdAt.slice(5, 7)}. ${post.createdAt.slice(8, 10)}.`,
    helpful: post.helpfulCount, growth: growthLabels[post.growthStage],
    // 목록 응답에는 본문이 없다. 추가 상세 요청이나 가짜 미리보기를 만들지 않는다.
    preview: '', content: { good: '', regret: '', learned: '', next: '' },
  }
}

export function detailToExperience(post: PostDetail): Experience {
  return { ...summaryToExperience(post), authorId: post.authorId, status: post.status,
    content: { good: post.goodPoints ?? '', regret: post.badPoints ?? '', learned: post.lessons ?? '', next: post.nextPlan ?? '' } }
}

export const postsApi = {
  list: (query: ListQuery, signal?: AbortSignal) => apiRequest<PostPage>(listPath(query), { signal }),
  detail: (id: number, signal?: AbortSignal) => apiRequest<PostDetail>(`/api/posts/${id}`, { signal }),
  create: (draft: ExperienceDraft) => apiRequest<PostDetail>('/api/posts', { method: 'POST', body: JSON.stringify(toCreateRequest(draft)) }),
  helpful: (id: number, signal?: AbortSignal) => apiRequest<HelpfulResponse>(`/api/posts/${id}/helpful`, { signal }),
  setHelpful: (id: number, helped: boolean) => apiRequest<HelpfulResponse>(`/api/posts/${id}/helpful`, { method: helped ? 'POST' : 'DELETE' }),
  me: (signal?: AbortSignal) => apiRequest<Me>('/api/me', { signal }),
}
