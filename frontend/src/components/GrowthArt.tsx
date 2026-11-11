import type { Growth } from '../types/experience'

/**
 * 성장 단계 그림 (씨앗 → 싹 → 봉우리 → 꽃)
 * 흙과 잎은 파란 계열, 봉우리와 꽃만 분홍으로 포인트를 준다.
 * BoardGrowthIcon(게시판·카드·마이페이지)과 GrowthIcon(상세·글쓰기)이 같이 쓴다.
 */

const SOIL = '#9fb2df'
const STEM = '#7f95c9'
const LEAF_LEFT = '#9fb2df'
const LEAF_RIGHT = '#b9c8ec'
const PINK = '#f08a9f'
const PINK_LIGHT = '#f2a2b4'
const CENTER = '#f6c453'

const PETALS = [
  { cx: 16, cy: 4.5, r: 0 },
  { cx: 18.95, cy: 6.64, r: 72 },
  { cx: 17.82, cy: 10.11, r: 144 },
  { cx: 14.18, cy: 10.11, r: 216 },
  { cx: 13.05, cy: 6.64, r: 288 },
]

export function growthLevel(stage: Growth) {
  return stage === '씨앗' ? 0 : stage === '싹' ? 1 : stage === '봉우리' ? 2 : 3
}

export function GrowthArt({ stage }: { stage: Growth }) {
  const level = growthLevel(stage)
  return (
    <svg viewBox="0 0 32 32" fill="none">
      <g transform="translate(-4 -0.5) scale(1.25)">
        {/* 흙 */}
        <path d="M8.5 21.6c2.2-1.6 4.8-2.3 7.5-2.3s5.3.7 7.5 2.3Z" fill={SOIL} opacity=".55" />
        <path d="M8 21.6h16" stroke={SOIL} strokeWidth="1.3" strokeLinecap="round" />

        {/* 씨앗 */}
        {level === 0 && (
          <>
            <ellipse cx="16" cy="19.2" rx="2.6" ry="1.9" fill="#8a9bc4" />
            <path d="M15 18.6c.6-.5 1.4-.6 2-.2" stroke="#c3cde6" strokeWidth=".7" strokeLinecap="round" />
          </>
        )}

        {/* 줄기 */}
        {level >= 1 && (
          <path
            d={`M16 20.4V${level === 3 ? 10.5 : level === 2 ? 11.5 : 14.5}`}
            stroke={STEM}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}

        {/* 잎 */}
        {level === 1 && (
          <>
            <path d="M16 16.6c-3.6.2-5-1.6-5-4 3.2-.3 5 1 5 4Z" fill={LEAF_LEFT} />
            <path d="M16 15.4c3.2.1 4.4-1.4 4.4-3.5-2.8-.3-4.4.9-4.4 3.5Z" fill={LEAF_RIGHT} />
          </>
        )}
        {level >= 2 && (
          <>
            <path d="M16 18.4c-3.6.2-5-1.6-5-4 3.2-.3 5 1 5 4Z" fill={LEAF_LEFT} />
            <path d="M16 16.4c3.4.1 4.6-1.5 4.6-3.6-3-.3-4.6.9-4.6 3.6Z" fill={LEAF_RIGHT} />
          </>
        )}

        {/* 봉우리 */}
        {level === 2 && (
          <>
            <path
              d="M16 6.6c2.2 1.2 3 3 2.6 4.6-.4 1-1.4 1.5-2.6 1.5s-2.2-.5-2.6-1.5c-.4-1.6.4-3.4 2.6-4.6Z"
              fill="#ee9fb0"
            />
            <path d="M16 7.4c-.9 1.2-1.1 2.8-.6 4.6" stroke="#e07b93" strokeWidth=".8" strokeLinecap="round" />
          </>
        )}

        {/* 꽃 */}
        {level === 3 && (
          <>
            {PETALS.map((p, i) => (
              <ellipse
                key={p.r}
                cx={p.cx}
                cy={p.cy}
                rx="2.3"
                ry="2.9"
                transform={`rotate(${p.r} ${p.cx} ${p.cy})`}
                fill={i % 2 ? PINK_LIGHT : PINK}
              />
            ))}
            <circle cx="16" cy="7.6" r="1.7" fill={CENTER} />
          </>
        )}
      </g>
    </svg>
  )
}
