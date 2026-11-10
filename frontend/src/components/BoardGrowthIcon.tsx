import type { Growth } from '../types/experience'

export function BoardGrowthIcon({ stage }: { stage: Growth }) {
  const level = stage === "씨앗" ? 0 : stage === "싹" ? 1 : stage === "봉우리" ? 2 : 3;
  return (
    <span className="board-growth-icon" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M10 23h12l-1.4 6h-9.2L10 23Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 22.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {level === 0 ? (
          <ellipse cx="16" cy="20" rx="2.5" ry="1.7" fill="currentColor" opacity=".72" />
        ) : (
          <path d="M16 23V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        )}
        {level >= 1 && (
          <path
            d="M16 18c-4 .1-5.7-1.8-5.7-4.7 3.7-.3 5.7 1.3 5.7 4.7Z"
            fill="currentColor"
            opacity=".66"
          />
        )}
        {level >= 2 && (
          <path
            d="M16 14.5c4 .1 5.7-1.8 5.7-4.7-3.7-.3-5.7 1.3-5.7 4.7Z"
            fill="currentColor"
            opacity=".82"
          />
        )}
        {level >= 3 && (
          <>
            <circle
              cx="16"
              cy="7.4"
              r="3.7"
              fill="#fafaf8"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle cx="16" cy="7.4" r="1.2" fill="currentColor" />
          </>
        )}
      </svg>
    </span>
  );
}

