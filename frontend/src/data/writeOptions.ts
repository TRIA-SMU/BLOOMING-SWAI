export const resultLabels = { SUCCESS: '성공', FAILURE: '실패', STOPPED: '중단' } as const
export const challengeLabels = { CONTEST: '공모전', ACTIVITY: '대외활동', INTERN: '인턴', JOB: '취업', PROJECT: '프로젝트', ETC: '기타' } as const
export const stageLabels = { DOCUMENT: '서류', INTERVIEW: '면접', PRESENTATION: '발표', PRELIMINARY: '예선', FINAL: '본선', ETC: '기타' } as const
export const prepPeriodLabels = { WITHIN_1_WEEK: '1주 이내', WEEKS_2: '2주', MONTH_1: '1개월', MONTHS_3: '3개월', OVER_3_MONTHS: '3개월 이상' } as const
export const applyFieldLabels = { PLANNING: '기획', DEVELOPMENT: '개발', DESIGN: '디자인', MARKETING: '마케팅', DATA: '데이터', ETC: '기타' } as const
export type PrepPeriodCode = keyof typeof prepPeriodLabels
export type ApplyFieldCode = keyof typeof applyFieldLabels
export const factorLabels = {
  // 1줄 (성공)
  USER_RESEARCH: '사용자 조사',
  ROLE_DIVISION: '역할 분담',
  SCHEDULE_MANAGEMENT: '일정 관리',
  THOROUGH_PREP: '철저한 준비',
  TEAMWORK: '팀워크·소통',
  FEEDBACK_APPLIED: '피드백 반영',
  STEADY_EFFORT: '꾸준한 노력',
  // 2줄 (실패)
  LACK_OF_PREP: '준비 부족',
  LACK_OF_TIME: '시간 부족',
  LACK_OF_COMMUNICATION: '소통 부족',
  LACK_OF_SKILL: '기술 역량 부족',
  WRONG_DIRECTION: '방향 설정 오류',
  NO_FEEDBACK: '피드백 부재',
  // 3줄 (중단 + 기타)
  SCHEDULE_CONFLICT: '일정 충돌',
  LOST_MOTIVATION: '동기 저하',
  MEMBER_DROPOUT: '팀원 이탈',
  HEALTH_ISSUE: '건강·체력 문제',
  PRIORITY_CHANGE: '우선순위 변경',
  LACK_OF_RESOURCES: '리소스 부족',
  ETC: '기타',
} as const

// 화면에 보여줄 줄 구성 (7 / 6 / 7)
export const factorRows: (keyof typeof factorLabels)[][] = [
  ['USER_RESEARCH', 'ROLE_DIVISION', 'SCHEDULE_MANAGEMENT', 'THOROUGH_PREP', 'TEAMWORK', 'FEEDBACK_APPLIED', 'STEADY_EFFORT'],
  ['LACK_OF_PREP', 'LACK_OF_TIME', 'LACK_OF_COMMUNICATION', 'LACK_OF_SKILL', 'WRONG_DIRECTION', 'NO_FEEDBACK'],
  ['SCHEDULE_CONFLICT', 'LOST_MOTIVATION', 'MEMBER_DROPOUT', 'HEALTH_ISSUE', 'PRIORITY_CHANGE', 'LACK_OF_RESOURCES', 'ETC'],
]