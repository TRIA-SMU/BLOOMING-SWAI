import { apiRequest } from './client.ts'

export const reportReasons = {
  DEFAMATION: '특정 개인·기관 비방',
  PERSONAL_INFO: '개인정보 노출',
  SPAM: '광고·스팸',
  ETC: '기타',
} as const
export type ReportReason = keyof typeof reportReasons
export interface ReportRequest { reason: ReportReason; detail?: string }

export function buildReportRequest(reason: ReportReason | '', detail: string): ReportRequest {
  if (!reason || !Object.hasOwn(reportReasons, reason)) throw new Error('신고 사유를 골라 주세요.')
  if (reason !== 'ETC') return { reason }
  if (detail.length > 200) throw new Error('신고 내용은 200자 이내로 적어 주세요.')
  const trimmed = detail.trim()
  return trimmed ? { reason, detail: trimmed } : { reason }
}

export const reportApi = {
  submit: (postId: number, request: ReportRequest) => apiRequest<{ message: string }>(`/api/posts/${postId}/report`, {
    method: 'POST', body: JSON.stringify(request),
  }),
}
