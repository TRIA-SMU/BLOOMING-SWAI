import { apiRequest } from './client.ts'
import type { PostDetail, PostSummary } from './posts.ts'
import { toCreateRequest } from './posts.ts'
import type { ExperienceDraft } from '../utils/experienceDraft.ts'

export type MyPost = Omit<PostSummary, 'authorNickname' | 'factorTags'> & { status: 'PUBLIC' | 'HIDDEN' }
export interface MyPageResponse { nickname: string; helpedCount: number; posts: MyPost[] }
export function postToDraft(post: PostDetail): ExperienceDraft {
  return {
    title: post.title, resultType: post.resultType, challengeType: post.challengeType, stage: post.stage,
    factorTags: [...post.factorTags], goodPoints: post.goodPoints ?? '', badPoints: post.badPoints ?? '',
    lessons: post.lessons ?? '', nextPlan: post.nextPlan ?? '',
  }
}
export const mypageApi = {
  get: (signal?: AbortSignal) => apiRequest<MyPageResponse>('/api/posts/me', { signal }),
  detail: (id: number, signal?: AbortSignal) => apiRequest<PostDetail>(`/api/posts/${id}`, { signal }),
  update: (id: number, draft: ExperienceDraft) => apiRequest<PostDetail>(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(toCreateRequest(draft)) }),
  remove: (id: number) => apiRequest<void>(`/api/posts/${id}`, { method: 'DELETE' }),
}
export type MyPageApi = typeof mypageApi
