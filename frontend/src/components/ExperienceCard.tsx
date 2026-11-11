import { Heart } from 'lucide-react'
import { BoardGrowthIcon } from './BoardGrowthIcon'
import { ResultBadge } from './ResultBadge'
import type { Experience } from '../types/experience'

export function ExperienceCard({ item, onClick }: { item: Experience; onClick: () => void }) {
  return <article className="experience-card">
    <div className="card-main">
      <div className="card-reading">
        <div className="card-context card-context--top">
          <div className="badge-row">
            <ResultBadge result={item.result} />
            <span>{item.type}</span><span className="meta-dot">·</span><span>{item.stage} 단계</span>
          </div>
          <div className="tag-row board-tag-row">{item.tags.map((tag) => <span className="factor-tag" key={tag}>{tag}</span>)}</div>
        </div>
        <h2><button className="card-title-button" onClick={onClick}>{item.title}<span className="sr-only"> 상세 보기</span></button></h2>
        {item.preview && <p className="card-preview">{item.preview}</p>}
      </div>
      <dl className="card-metadata" aria-label="작성 정보와 반응">
        <div><dt>작성자</dt><dd className="card-author" title={item.nickname}>{item.nickname}</dd></div>
        <div><dt>날짜</dt><dd className="card-date"><span className="card-date-full">{item.date.replace(/\.$/, '')}</span><span className="card-date-short" aria-hidden="true">{item.date.replace(/^\d{4}\.\s*/, '').replace(/\.$/, '')}</span></dd></div>
        <div><dt>성장 단계</dt><dd className="card-growth"><BoardGrowthIcon stage={item.growth} /><span>{item.growth}</span></dd></div>
        <div><dt>도움</dt><dd className="card-helpful"><Heart size={16} aria-hidden="true" /><span>{item.helpful}</span><span className="sr-only">개의 도움이 돼요</span></dd></div>
      </dl>
    </div>
  </article>
}
