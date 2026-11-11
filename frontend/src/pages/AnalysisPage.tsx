import { useEffect, useRef, useState } from 'react'
import { BarChart3, Check, ChevronRight, CircleDot, Flower2, Search } from 'lucide-react'
import { analysisApi } from '../api/analysis'
import type { AnalysisQuery, AnalysisResponse, FactorCode } from '../api/analysis'
import type { ChallengeCode } from '../api/posts'
import { summaryToExperience } from '../api/posts'
import { errorMessage } from '../api/client'
import { applyFieldLabels, challengeLabels, factorLabels, prepPeriodLabels } from '../data/writeOptions'
import type { ApplyFieldCode, PrepPeriodCode } from '../data/writeOptions'
import { ResultBadge } from '../components/ResultBadge'
import type { Experience } from '../types/experience'
import './AnalysisPage.css'

// 통계에서 원인을 추론하지 않고, 사용자가 고쳐서 담을 수 있는 행동 문장만 제공한다.
const actions: Record<FactorCode, [string, string]> = {
  USER_RESEARCH: ['사용자 조사로 필요한 요구를 확인하기', '사용자 조사 없이 방향을 확정하지 않기'],
  ROLE_DIVISION: ['팀원의 역할과 책임을 미리 정하기', '역할이 겹치거나 빠진 부분을 방치하지 않기'],
  SCHEDULE_MANAGEMENT: ['마감 전 중간 점검 일정을 정하기', '준비 일정을 마지막까지 미루지 않기'],
  THOROUGH_PREP: ['준비 항목을 목록으로 정리해 미리 점검하기', '준비를 마감 직전으로 미루지 않기'],
  TEAMWORK: ['팀원과 진행 상황을 정기적으로 공유하기', '의견 차이를 말하지 않고 넘기지 않기'],
  FEEDBACK_APPLIED: ['주변의 피드백을 받아 결과물에 반영하기', '받은 피드백을 확인만 하고 넘기지 않기'],
  STEADY_EFFORT: ['작은 목표를 정해 꾸준히 이어가기', '한꺼번에 몰아서 준비하지 않기'],
  LACK_OF_PREP: ['지원 요건과 준비 항목을 미리 점검하기', '필수 준비 항목을 빠뜨리지 않기'],
  LACK_OF_TIME: ['남은 시간을 기준으로 우선순위 정하기', '준비 시간을 넉넉하다고 단정하지 않기'],
  LACK_OF_COMMUNICATION: ['진행 상황과 어려움을 팀에 바로 공유하기', '혼자 판단하고 넘어가지 않기'],
  LACK_OF_SKILL: ['필요한 기술을 미리 점검하고 학습 계획 세우기', '부족한 부분을 확인하지 않고 시작하지 않기'],
  WRONG_DIRECTION: ['목표와 방향을 중간에 한 번 더 확인하기', '방향을 확인하지 않고 끝까지 진행하지 않기'],
  NO_FEEDBACK: ['중간 결과를 보여주고 의견 구하기', '피드백 없이 혼자 마무리하지 않기'],
  SCHEDULE_CONFLICT: ['다른 일정과 겹치는지 미리 확인하기', '일정이 겹치는 걸 알고도 그대로 두지 않기'],
  LOST_MOTIVATION: ['도전을 시작한 이유와 작은 목표를 다시 적어보기', '지친 상태를 혼자 오래 두지 않기'],
  MEMBER_DROPOUT: ['팀원의 참여 가능 시간과 범위를 미리 맞추기', '역할을 한 사람에게만 몰아두지 않기'],
  HEALTH_ISSUE: ['컨디션을 고려해 여유 있는 계획 세우기', '무리한 일정을 그대로 밀어붙이지 않기'],
  PRIORITY_CHANGE: ['우선순위가 바뀌면 계획을 다시 조정하기', '바뀐 우선순위를 공유하지 않고 두지 않기'],
  LACK_OF_RESOURCES: ['필요한 자원과 도움받을 곳을 미리 확인하기', '자원이 부족한 채로 시작하지 않기'],
  ETC: ['관련 경험을 읽고 내 준비 항목 정하기', '관련 경험에서 반복된 아쉬움 점검하기'],
}
interface PrepItem { key: string; text: string; selected: boolean; savedFor?: number }

export function AnalysisPage({ onDetail, authenticated, userId, onLogin, onChecklist }: {
  onDetail: (item: Experience) => void; authenticated: boolean; userId?: number; onLogin: () => void; onChecklist: () => void
}) {
  const [type, setType] = useState<ChallengeCode | ''>('')
  const [keyword, setKeyword] = useState('')
  const [prepPeriod, setPrepPeriod] = useState<PrepPeriodCode | ''>('')
  const [applyField, setApplyField] = useState<ApplyFieldCode | ''>('')
  const [query, setQuery] = useState<AnalysisQuery | null>(null)
  const [retry, setRetry] = useState(0)
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFactor, setSelectedFactor] = useState<FactorCode | null>(null)
  const [items, setItems] = useState<PrepItem[]>([])
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)

  const isSaved = (item?: PrepItem) => userId != null && item?.savedFor === userId

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    analysisApi.get(query, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result)
    }).catch((err: unknown) => { if (!controller.signal.aborted) setError(errorMessage(err)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [query, retry])

  const reset = () => {
    setQuery(null); setData(null); setLoading(false); setError(''); setMessage(''); setSelectedFactor(null); setItems([])
  }
  const analyze = () => {
    if (!type) { setMessage('먼저 도전 유형을 선택해 주세요.'); return }
    setData(null); setError(''); setMessage(''); setSelectedFactor(null); setItems([]); setLoading(true)
    setQuery({ challengeType: type, keyword: keyword.trim(), prepPeriod, applyField })
  }
  const selectFactor = (tag: FactorCode) => {
    setSelectedFactor((previous) => previous === tag ? null : tag)
  }
  const togglePrep = (tag: FactorCode, side: 0 | 1) => {
    const key = `${tag}-${side}`
    setMessage('')
    setItems((previous) => previous.some((item) => item.key === key)
      ? previous.map((item) => item.key === key && !isSaved(item) ? { ...item, selected: !item.selected } : item)
      : [...previous, { key, text: actions[tag][side], selected: true }])
  }
  const save = async () => {
    if (!authenticated || userId == null) { onLogin(); return }
    if (!query || saveLock.current) return
    const chosen = items.filter((item) => item.selected && !isSaved(item))
    if (!chosen.length) return
    saveLock.current = true; setSaving(true); setMessage('')
    try {
      await analysisApi.saveInsights(query.challengeType, chosen.map((item) => item.text))
      setItems((previous) => previous.map((item) => chosen.some((chosenItem) => chosenItem.key === item.key) ? { ...item, savedFor: userId } : item))
      setMessage('내 체크리스트에 담았어요.')
    } catch (err) { setMessage(errorMessage(err)) }
    finally { saveLock.current = false; setSaving(false) }
  }
  const related = data?.relatedPosts.filter((post) => !selectedFactor || post.factorTags.includes(selectedFactor)) ?? []
  const chosenCount = items.filter((item) => item.selected && !isSaved(item)).length

  return <main id="main-content" className="analysis-page">
    <header className="feature-heading"><div><span className="feature-icon"><BarChart3 size={21} /></span><div>
      <h1>다음 도전, 경험에서 힌트를 찾아요</h1><p>다른 사람들의 준비 과정과 경험을 비교해 나에게 필요한 준비를 확인해보세요.</p>
    </div></div></header>
    <form className="analysis-filter" aria-label="분석 조건" onSubmit={(event) => { event.preventDefault(); analyze() }}>
      <fieldset disabled={saving} className="analysis-controls">
        <div className="analysis-field"><span className="analysis-label" id="analysis-type-label">도전 유형</span>
          <div className="analysis-type-options" role="group" aria-labelledby="analysis-type-label">
            {(Object.entries(challengeLabels) as [ChallengeCode, string][]).map(([code, label]) => <button type="button" key={code} className={`analysis-type${type === code ? ' active' : ''}`} aria-pressed={type === code}
              onClick={() => { reset(); setType(code) }}>{label}</button>)}
          </div></div>
        <label className="analysis-field"><span className="analysis-label">활동명 또는 키워드</span><div className="analysis-input"><Search size={17} />
          <input value={keyword} onChange={(event) => { reset(); setKeyword(event.target.value) }} placeholder="예: 콘텐츠 마케팅 인턴" />
        </div></label>
        <div className="analysis-optional-row">
          <label className="analysis-field"><span className="analysis-label">준비 기간 <small className="analysis-optional">선택</small></span>
            <select value={prepPeriod} onChange={(event) => { reset(); setPrepPeriod(event.target.value as PrepPeriodCode | '') }}>
              <option value="">전체</option>{(Object.entries(prepPeriodLabels) as [PrepPeriodCode, string][]).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select></label>
          <label className="analysis-field"><span className="analysis-label">지원 분야 <small className="analysis-optional">선택</small></span>
            <select value={applyField} onChange={(event) => { reset(); setApplyField(event.target.value as ApplyFieldCode | '') }}>
              <option value="">전체</option>{(Object.entries(applyFieldLabels) as [ApplyFieldCode, string][]).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select></label>
          <button className="button button--primary analysis-submit" disabled={loading}><BarChart3 size={17} />{loading ? '분석 중…' : '분석하기'}</button>
        </div>
      </fieldset>
      <div className="analysis-filter-foot" aria-live="polite">{data ? <>현재 조건과 일치하는 기록 <strong>{data.totalCount}개</strong></> : '도전 유형을 고르고 분석하기를 눌러 주세요.'}</div>
    </form>
    {!query && <section className="analysis-guide"><span className="guide-mark"><CircleDot size={22} /></span><h2>어떤 도전을 준비하고 있나요?</h2><p>도전 유형을 선택하면 성공과 실패·중단 경험에서 자주 언급된 준비 요인을 비교해 드려요.</p></section>}
    {loading && <section className="analysis-guide" role="status"><span className="analysis-spinner" /><h2>경험 기록을 비교하고 있어요</h2><p>선택한 조건과 관련된 준비 과정과 요인을 정리하는 중입니다.</p></section>}
    {error && <section className="analysis-guide" role="alert"><h2>분석을 불러오지 못했어요</h2><p>{error}</p><button className="button button--secondary" onClick={() => { setError(''); setLoading(true); setRetry((value) => value + 1) }}>다시 시도</button></section>}
    {data && query && <div className="analysis-results">
      {(data.successCount < 5 || data.failureCount < 5) && <div className="insufficient-note">결과별 기록이 5건 미만이면 비율 대신 현재 건수를 보여드려요. 실제 경험 내용을 함께 확인해 주세요.</div>}
      <section className="summary-grid" aria-label="분석 결과 요약">
        <div className="summary-card"><span>분석 대상</span><strong>{data.totalCount}</strong><small>개의 경험 기록</small></div>
        <div className="summary-card summary-card--flower"><Flower2 size={18} /><span>성공 경험</span><strong>{data.successCount}</strong></div>
        <div className="summary-card summary-card--seed"><CircleDot size={18} /><span>실패·중단 경험</span><strong>{data.failureCount}</strong></div>
        <div className="summary-card summary-card--factor"><span>가장 많이 언급된 준비 요인</span><strong>{data.topFactor ? factorLabels[data.topFactor] : '아직 없어요'}</strong><small>기록 속 언급 기준</small></div>
      </section>
      {data.totalCount === 0 ? <section className="analysis-guide"><h2>조건에 맞는 기록이 아직 없어요</h2><p>검색어를 바꾸거나 다른 도전 유형을 골라 주세요.</p></section> : <>
      <section className="analysis-section factor-comparison"><div className="section-heading-row"><div><h2>주요 준비 요인 비교</h2><p>각 결과의 전체 기록 중 해당 요인을 태그한 비율이에요.</p></div><div className="chart-legend"><span><i className="flower-swatch" />성공</span><span><i className="seed-swatch" />실패·중단</span></div></div>
        <div className="factor-list">{data.factors.map((factor) => <button type="button" className={`factor-row${selectedFactor === factor.tag ? ' active' : ''}`} key={factor.tag} aria-pressed={selectedFactor === factor.tag} onClick={() => selectFactor(factor.tag)}>
          <strong>{factorLabels[factor.tag]}</strong><div className="factor-bars">
            {([{ side: 'success', total: data.successCount, count: factor.successCount, rate: factor.successRate, label: '성공', bar: 'flower-bar' }, { side: 'failure', total: data.failureCount, count: factor.failureCount, rate: factor.failureRate, label: '실패·중단', bar: 'seed-bar' }] as const).map((row) => <div className="factor-bar-line" key={row.side}>
              <span className="sr-only">{row.label}</span><span className="factor-bar-track" aria-hidden="true"><i className={`factor-bar ${row.bar}`} style={{ width: `${row.total >= 5 ? Math.min(100, Math.max(0, row.rate)) : 0}%` }} /></span>
              <small>{row.total >= 5 ? `${row.rate}% · ${row.count}/${row.total}건` : `기록 부족 · ${row.count}/${row.total}건`}</small>
            </div>)}
          </div><ChevronRight size={17} /></button>)}</div>
        <p className="chart-note">언급 빈도는 성공의 원인이나 성공 확률을 의미하지 않습니다. 요인을 누르면 대표 경험 중 해당 태그가 있는 글을 확인할 수 있어요.</p>
      </section>
      <section className="analysis-section checklist-section"><div className="section-heading-row"><div><h2>준비 체크리스트</h2><p>참고할 요인을 골라 ‘할 것’과 ‘피할 것’으로 담아 보세요. 문장을 직접 고칠 수 있어요.</p></div><button className="button button--secondary" onClick={onChecklist}>체크리스트에서 관리 <ChevronRight size={15} /></button></div>
        <div className="prep-checklist">{data.factors.flatMap((factor) => ([0, 1] as const).filter((side) => side === 0 ? data.successCount >= 5 && factor.successCount > 0 : data.failureCount >= 5 && factor.failureCount > 0).map((side) => {
          const key = `${factor.tag}-${side}`; const item = items.find((entry) => entry.key === key)
          return <div className={`prep-item${item?.selected ? ' checked' : ''}`} key={key}>
            <label><input type="checkbox" aria-label={`${factorLabels[factor.tag]} ${side === 0 ? '할 것' : '피할 것'}`} checked={item?.selected ?? false} disabled={saving || isSaved(item)} onChange={() => togglePrep(factor.tag, side)} /><span className="custom-check">{item?.selected && <Check size={14} />}</span><span>{side === 0 ? '할 것' : '피할 것'} · {factorLabels[factor.tag]}</span></label>
            {item?.selected && <><input className="prep-content" aria-label={`${factorLabels[factor.tag]} ${side === 0 ? '할 것' : '피할 것'} 문장`} value={item.text} maxLength={100} disabled={saving || isSaved(item)} onChange={(event) => setItems((previous) => previous.map((entry) => entry.key === key ? { ...entry, text: event.target.value } : entry))} />{isSaved(item) && <small>담기 완료</small>}</>}
          </div>
        }))}</div>
        {data.successCount < 5 && data.failureCount < 5 && <p className="chart-note">기록이 더 모이면 요인을 참고해 준비 항목을 담을 수 있어요.</p>}
        <div className="analysis-action-row"><button className="button button--primary" disabled={!chosenCount || saving} onClick={() => void save()}>{saving ? '담는 중…' : `선택한 ${chosenCount}개 담기`}</button></div>
      </section>
      <section className="analysis-section related-section"><div className="section-heading-row"><div><h2>관련 경험{selectedFactor ? ` · ${factorLabels[selectedFactor]}` : ''}</h2><p>{query.keyword ? `‘${query.keyword}’` : challengeLabels[query.challengeType]} 관련 기록 중 도움이 돼요가 많은 대표 경험이에요.</p></div></div>
        <div className="related-experiences">{related.map((post) => { const item = summaryToExperience(post); return <button className="related-card" onClick={() => onDetail(item)} key={post.id}><div><ResultBadge result={item.result} /><span>{item.type}</span><span>{item.stage}</span></div><h3>{item.title}</h3><div className="related-card-foot"><span>{item.tags.join(' · ')}</span><ChevronRight size={17} /></div></button> })}</div>
        {!related.length && <p className="chart-note">대표 경험 중 이 태그가 있는 글은 없어요. 선택한 요인을 다시 누르면 전체 대표 경험을 볼 수 있어요.</p>}
      </section></>}
    </div>}
    {message && <div className="api-banner analysis-message" role="status"><span>{message}</span><button onClick={() => setMessage('')}>닫기</button></div>}
  </main>
}
