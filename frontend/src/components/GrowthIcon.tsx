import type { Growth } from '../types/experience'

export function GrowthIcon({ stage, size = "lg" }: { stage: Growth; size?: "sm" | "md" | "lg" }) {
  const leaves = stage === "씨앗" ? 0 : stage === "싹" ? 1 : stage === "봉우리" ? 2 : 3;
  return (
    <span className={`growth-icon growth-icon--${size}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 27V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        {leaves >= 1 && (
          <path d="M16 20c-5 .2-7-2.2-7-6 4.7-.4 7 1.6 7 6Z" fill="currentColor" opacity=".7" />
        )}
        {leaves >= 2 && (
          <path d="M16 16c5 .2 7-2.2 7-6-4.7-.4-7 1.6-7 6Z" fill="currentColor" opacity=".86" />
        )}
        {leaves >= 3 && (
          <>
            <circle cx="16" cy="8" r="4.2" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="8" r="1.5" fill="currentColor" />
          </>
        )}
        {leaves === 0 && (
          <ellipse cx="16" cy="24" rx="4" ry="2.8" fill="currentColor" opacity=".75" />
        )}
        <path
          d="M8 28h16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".35"
        />
      </svg>
    </span>
  );
}
