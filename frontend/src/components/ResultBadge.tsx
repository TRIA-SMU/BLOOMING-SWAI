import { CircleDot, Flower2, Pause } from 'lucide-react'
import type { ResultType } from '../types/experience'

export function ResultBadge({ result }: { result: ResultType }) {
  const Icon = result === '성공' ? Flower2 : result === '실패' ? CircleDot : Pause
  return <span className={`result-badge result-badge--${result}`}><Icon size={13} strokeWidth={2} />{result}</span>
}
