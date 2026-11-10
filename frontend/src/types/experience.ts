export type ResultType = '성공' | '실패' | '중단'
export type Growth = '씨앗' | '싹' | '봉우리' | '꽃'

// 화면용 목 데이터. 서버 응답과의 변환은 API 연동 단계에서 분리한다.
export interface Experience {
  id: number
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
