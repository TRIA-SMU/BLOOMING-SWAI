import { ExperienceCard } from '../components/ExperienceCard'
import { experiences } from '../data/experiences'
import './BoardPage.css'

export function BoardPreview() {
  return <div className="page-container"><div className="api-banner">게시판 디자인 미리보기 · 실제 API를 사용하지 않아요.</div><main><div className="page-heading"><h1>경험 게시판</h1></div><div className="experience-list"><div className="experience-list-head" aria-hidden="true"><span>경험</span><div><span>작성자</span><span>날짜</span><span>성장 단계</span><span>도움</span></div></div>{experiences.slice(0, 4).map((item) => <ExperienceCard key={item.id} item={item} onClick={() => {}} />)}</div></main></div>
}
