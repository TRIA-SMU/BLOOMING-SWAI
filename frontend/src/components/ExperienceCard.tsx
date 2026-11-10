import { CircleDot, Flower2, Heart, Pause } from 'lucide-react'
import { BoardGrowthIcon } from './BoardGrowthIcon'
import type { Experience } from '../types/experience'

export function ExperienceCard({ item, onClick }: { item: Experience; onClick: () => void }) {
  const ResultIcon = item.result === '성공' ? Flower2 : item.result === '실패' ? CircleDot : Pause
  return <article className="experience-card">
    <div className="card-main">
      <div className="card-reading">
        <div className="card-context card-context--top">
          <div className="badge-row">
            <span className={`result-badge result-badge--${item.result}`}><ResultIcon size={13} strokeWidth={2} />{item.result}</span>
            <span>{item.type}</span><span className="meta-dot">·</span><span>{item.stage} 단계</span>
          </div>
          <div className="tag-row board-tag-row">{item.tags.map((tag) => <span className="factor-tag" key={tag}>{tag}</span>)}</div>
        </div>
        <h2><button className="card-title-button" onClick={onClick}>{item.title}<span className="sr-only"> 상세 보기</span></button></h2>
        <p className="card-preview">{item.preview}</p>
      </div>
      <aside className="card-response-panel" aria-label="경험 반응">
        <div className="growth-status"><BoardGrowthIcon stage={item.growth} /><span><small>성장 단계</small><strong>{item.growth}</strong></span></div>
        <div className="helpful-count"><Heart size={16} /><span><small>도움이 돼요</small><strong>{item.helpful}</strong></span></div>
        <div className="card-footer"><strong>{item.nickname}</strong><span className="meta-dot">·</span><span>{item.date.replace(/\.$/, '')}</span></div>
      </aside>
    </div>
  </article>
}
