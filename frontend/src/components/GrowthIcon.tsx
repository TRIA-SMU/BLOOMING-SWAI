import type { Growth } from '../types/experience'
import { GrowthArt } from './GrowthArt'

export function GrowthIcon({ stage, size = 'lg' }: { stage: Growth; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`growth-icon growth-icon--${size}`} aria-hidden="true">
      <GrowthArt stage={stage} />
    </span>
  )
}
