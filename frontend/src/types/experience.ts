export type ResultType = '성공' | '실패' | '중단'
export type Growth = '씨앗' | '싹' | '봉우리' | '꽃'

// 화면 표시용 데이터. 서버의 영문 enum은 API 어댑터에서 한글로 변환한다.
export interface Experience {
  id: number
  authorId?: number
  status?: 'PUBLIC' | 'HIDDEN'
  result: ResultType
  title: string
  type: string
  stage: string
  tags: string[]
  preview: string
  nickname: string
  date: string
  helpful: number
  growth: Growth
  content: { good: string; regret: string; learned: string; next: string }
}
