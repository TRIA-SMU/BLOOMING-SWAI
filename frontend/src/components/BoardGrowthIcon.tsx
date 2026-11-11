import type { Growth } from '../types/experience'
import { GrowthArt } from './GrowthArt'

export function BoardGrowthIcon({ stage }: { stage: Growth }) {
  return (
    <span className="board-growth-icon" aria-hidden="true">
      <GrowthArt stage={stage} />
    </span>
  )
}
