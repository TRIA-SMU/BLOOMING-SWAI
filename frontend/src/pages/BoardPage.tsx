import { useEffect, useState } from 'react'
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, SquarePen, X } from 'lucide-react'
import { postsApi, summaryToExperience } from '../api/posts'
import type { ChallengeCode, PostPage, ResultCode } from '../api/posts'
import { errorMessage } from '../api/client'
import { challengeLabels, resultLabels } from '../data/writeOptions'
import { ExperienceCard } from '../components/ExperienceCard'
import { BoardGrowthIcon } from '../components/BoardGrowthIcon'
import type { Experience } from '../types/experience'
import './BoardPage.css'

const results = Object.keys(resultLabels) as ResultCode[]

export function BoardPage({ onWrite, onDetail, refreshKey = 0, initialResult = 'SUCCESS' }: {
  onWrite: () => void
  onDetail: (item: Experience) => void
  refreshKey?: number
  initialResult?: ResultCode
}) {
  const [result, setResult] = useState<ResultCode>(initialResult)
  const [type, setType] = useState<ChallengeCode | ''>('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'latest' | 'helpful'>('latest')
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const requestKey = JSON.stringify([result, type, search, sort, page, refreshKey, retry])
  const [response, setResponse] = useState<{ key: string; data: PostPage | null; error: string }>({ key: '', data: null, error: '' })
  const loading = response.key !== requestKey
  const data = loading ? null : response.data
  const error = loading ? '' : response.error
  useEffect(() => {
    const controller = new AbortController()
    // 빠른 검색 입력과 필터 변경은 묶고, 이전 응답은 현재 목록을 덮어쓰지 못하게 한다.
    const timer = window.setTimeout(() => {
      postsApi.list({ resultType: result, challengeType: type || undefined, keyword: search, sort, page }, controller.signal)
        .then((data) => { if (!controller.signal.aborted) setResponse({ key: requestKey, data, error: '' }) })
        .catch((reason: unknown) => { if (!controller.signal.aborted) setResponse({ key: requestKey, data: null, error: errorMessage(reason) }) })
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [result, type, search, sort, page, refreshKey, retry, requestKey])
  const filtered = data?.content.map(summaryToExperience) ?? []

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
          onClick={() => { setResult(option); setPage(0) }}
          onKeyDown={(event) => {
            let next = index
            if (event.key === 'ArrowRight') next = (index + 1) % results.length
            else if (event.key === 'ArrowLeft') next = (index + results.length - 1) % results.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = results.length - 1
            else return
            event.preventDefault()
            setResult(results[next])
            setPage(0)
            document.getElementById(`result-tab-${next}`)?.focus()
          }}>
          {resultLabels[option]}
        </button>)}
      </div>
      <div className="filter-row">
        <label className="select-wrap"><SlidersHorizontal size={16} className="filter-leading-icon" /><span className="sr-only">도전 유형</span>
          <select value={type} onChange={(event) => { setType(event.target.value as ChallengeCode | ''); setPage(0) }}>
            <option value="">도전 유형 전체</option>
            {Object.entries(challengeLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
          <ChevronDown size={17} className="select-chevron" />
        </label>
        <div className="search-wrap"><Search size={18} /><label className="sr-only" htmlFor="experience-search">제목과 내용 검색</label>
          <input id="experience-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder="제목이나 내용으로 검색해 보세요" />
          {search && <button onClick={() => { setSearch(''); setPage(0) }} aria-label="검색어 지우기"><X size={16} /></button>}
        </div>
        <div className="sort-control" role="group" aria-label="정렬 기준"><ArrowUpDown size={14} />
          <button className={sort === 'latest' ? 'active' : ''} aria-pressed={sort === 'latest'} onClick={() => { setSort('latest'); setPage(0) }}>최신순</button><span />
          <button className={sort === 'helpful' ? 'active' : ''} aria-pressed={sort === 'helpful'} onClick={() => { setSort('helpful'); setPage(0) }}>도움이 돼요 순</button>
        </div>
      </div>
    </section>
    <div className="list-summary" aria-live="polite"><strong>{loading ? '경험을 불러오고 있어요' : error ? '목록을 불러오지 못했어요' : `${data?.totalElements ?? 0}개의 경험`}</strong></div>
    <section id="experience-results" role="tabpanel" aria-busy={loading} aria-labelledby={`result-tab-${results.indexOf(result)}`}>
      {loading ? <div className="empty-state" role="status">경험을 불러오는 중이에요.</div>
        : error ? <div className="empty-state" role="alert"><h2>목록을 불러오지 못했어요</h2><p>{error}</p><button className="button button--secondary" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></div>
        : filtered.length ? <div className="experience-list" aria-label="경험 목록"><div className="experience-list-head" aria-hidden="true"><span>경험</span><div><span>작성자</span><span>날짜</span><span>성장 단계</span><span>도움</span></div></div>{filtered.map((item) => <ExperienceCard key={item.id} item={item} onClick={() => onDetail(item)} />)}</div>
        : <div className="empty-state"><BoardGrowthIcon stage="싹" /><h2>조건에 맞는 경험이 아직 없어요</h2><p>검색어나 도전 유형을 바꾸면 다른 경험을 만날 수 있어요.</p>
          <button className="button button--secondary" onClick={() => { setType(''); setSearch(''); setPage(0) }}>검색 초기화</button>
        </div>}
    </section>
    {!loading && !error && data && data.totalPages > 1 && <nav className="pagination" aria-label="게시판 페이지">
      <button className="button button--secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>이전</button>
      <span aria-live="polite">{data.number + 1} / {data.totalPages}</span>
      <button className="button button--secondary" disabled={page >= data.totalPages - 1} onClick={() => setPage((value) => value + 1)}>다음</button>
    </nav>}
  </main>
}
