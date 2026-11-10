import { useState } from 'react'
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, SquarePen, X } from 'lucide-react'
import { experiences as demoExperiences } from '../data/experiences'
import { ExperienceCard } from '../components/ExperienceCard'
import { BoardGrowthIcon } from '../components/BoardGrowthIcon'
import type { Experience, ResultType } from '../types/experience'
import './BoardPage.css'

const results: ResultType[] = ['성공', '실패', '중단']
const types = ['전체', '공모전', '대외활동', '인턴', '취업', '프로젝트', '기타']

export function BoardPage({ onWrite, onDetail, experiences = demoExperiences }: {
  onWrite: () => void
  onDetail: (item: Experience) => void
  experiences?: Experience[]
}) {
  const [result, setResult] = useState<ResultType>('성공')
  const [type, setType] = useState('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'latest' | 'helpful'>('latest')
  const query = search.trim().toLocaleLowerCase()
  const filtered = experiences
    .filter((item) => item.result === result && (type === '전체' || item.type === type))
    .filter((item) => [item.title, item.preview, ...Object.values(item.content)].join(' ').toLocaleLowerCase().includes(query))
    .sort((a, b) => sort === 'helpful' ? b.helpful - a.helpful : b.date.localeCompare(a.date))

  return <main id="main-content">
    <section className="page-heading board-heading">
      <div><h1>경험 게시판</h1><p>성공도, 실패도, 잠시 멈춘 경험도 누군가의 다음 선택에 도움이 됩니다.</p></div>
      <button className="button button--primary write-button" onClick={onWrite} aria-label="경험 기록하기"><SquarePen size={17} /><span>경험 기록하기</span></button>
    </section>
    <section className="filter-panel" aria-label="게시글 필터">
      <div className="result-tabs" role="tablist" aria-label="결과 선택">
        {results.map((option, index) => <button
          key={option} id={`result-tab-${index}`} role="tab" aria-selected={result === option}
          aria-controls="experience-results" tabIndex={result === option ? 0 : -1}
          className={`result-tab${result === option ? ' result-tab--active' : ''}`}
          onClick={() => setResult(option)}
          onKeyDown={(event) => {
            let next = index
            if (event.key === 'ArrowRight') next = (index + 1) % results.length
            else if (event.key === 'ArrowLeft') next = (index + results.length - 1) % results.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = results.length - 1
            else return
            event.preventDefault()
            setResult(results[next])
            document.getElementById(`result-tab-${next}`)?.focus()
          }}>
          {option}<span>{experiences.filter((item) => item.result === option).length}</span>
        </button>)}
      </div>
      <div className="filter-row">
        <label className="select-wrap"><SlidersHorizontal size={16} className="filter-leading-icon" /><span className="sr-only">도전 유형</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>{types.map((option) => <option key={option} value={option}>{option === '전체' ? '도전 유형 전체' : option}</option>)}</select>
          <ChevronDown size={17} className="select-chevron" />
        </label>
        <div className="search-wrap"><Search size={18} /><label className="sr-only" htmlFor="experience-search">제목과 내용 검색</label>
          <input id="experience-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목이나 내용으로 검색해 보세요" />
          {search && <button onClick={() => setSearch('')} aria-label="검색어 지우기"><X size={16} /></button>}
        </div>
        <div className="sort-control" role="group" aria-label="정렬 기준"><ArrowUpDown size={14} />
          <button className={sort === 'latest' ? 'active' : ''} aria-pressed={sort === 'latest'} onClick={() => setSort('latest')}>최신순</button><span />
          <button className={sort === 'helpful' ? 'active' : ''} aria-pressed={sort === 'helpful'} onClick={() => setSort('helpful')}>도움이 돼요 순</button>
        </div>
      </div>
    </section>
    <div className="list-summary" aria-live="polite"><strong>{filtered.length}개의 경험</strong></div>
    <section id="experience-results" role="tabpanel" aria-labelledby={`result-tab-${results.indexOf(result)}`}>
      {filtered.length ? <div className="experience-list" aria-label="경험 목록">{filtered.map((item) => <ExperienceCard key={item.id} item={item} onClick={() => onDetail(item)} />)}</div>
        : <div className="empty-state"><BoardGrowthIcon stage="싹" /><h2>조건에 맞는 경험이 아직 없어요</h2><p>검색어나 도전 유형을 바꾸면 다른 경험을 만날 수 있어요.</p>
          <button className="button button--secondary" onClick={() => { setType('전체'); setSearch('') }}>검색 초기화</button>
        </div>}
    </section>
  </main>
}
