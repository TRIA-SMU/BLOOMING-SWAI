import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { ApiError, errorMessage } from '../api/client'
import { groupByPhase, roadmapActions, roadmapApi } from '../api/roadmap'
import type { RoadmapAction, RoadmapApi, RoadmapAvailability, RoadmapResponse } from '../api/roadmap'
import type { ChallengeCode } from '../api/posts'
import { challengeLabels } from '../data/writeOptions'
import aiMascot from '../assets/ai-mascot.png'
import './RoadmapPage.css'

export function RoadmapPage({ authenticated, onLogin, onWrite, onChecklist, api = roadmapApi }: {
  authenticated: boolean; onLogin: () => void; onWrite: () => void; onChecklist: () => void; api?: RoadmapApi
}) {
  const [availability, setAvailability] = useState<RoadmapAvailability | null>(null)
  const [availabilityError, setAvailabilityError] = useState('')
  const [availabilityRetry, setAvailabilityRetry] = useState(0)
  const [type, setType] = useState<ChallengeCode | ''>('')
  const [data, setData] = useState<RoadmapResponse | null>(null)
  const [actions, setActions] = useState<RoadmapAction[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadRetry, setLoadRetry] = useState(0)
  const [empty, setEmpty] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [generateError, setGenerateError] = useState('')
  const lock = useRef(false)
  const mounted = useRef(false)
  const generationController = useRef<AbortController | null>(null)
  const busy = generating || saving

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; generationController.current?.abort() }
  }, [])
  useEffect(() => {
    if (!authenticated) return
    const controller = new AbortController()
    api.availability(controller.signal).then((value) => { if (!controller.signal.aborted) { setAvailability(value); setAvailabilityError('') } })
      .catch((error: unknown) => { if (!controller.signal.aborted) setAvailabilityError(errorMessage(error)) })
    return () => controller.abort()
  }, [authenticated, api, availabilityRetry])
  useEffect(() => {
    if (!authenticated || !type) return
    const controller = new AbortController()
    api.latest(type, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setData(result); setActions(roadmapActions(result)); setEmpty(false)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && error.status === 404) setEmpty(true)
      else setLoadError(errorMessage(error))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [authenticated, type, api, loadRetry])

  const generate = async () => {
    if (!type || !availability?.available || lock.current) return
    lock.current = true; setGenerating(true); setGenerateError(''); setNotice('')
    const controller = new AbortController()
    generationController.current = controller
    try {
      const result = await api.create(type, controller.signal)
      if (!mounted.current || controller.signal.aborted) return
      setData(result); setActions(roadmapActions(result)); setEmpty(false)
      setNotice('새 로드맵을 만들고 저장했어요.')
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) setGenerateError(errorMessage(error))
    } finally { lock.current = false; if (mounted.current) setGenerating(false) }
  }
  const save = async () => {
    if (!data || lock.current) return
    const selected = actions.filter((item) => item.selected && !item.saved)
    if (!selected.length) return
    lock.current = true; setSaving(true); setNotice('')
    try {
      await api.save(data.challengeType, selected.map((item) => ({ content: item.content, phase: item.phase, stepOrder: item.order })))
      if (!mounted.current) return
      setActions((previous) => previous.map((item) => selected.some((entry) => entry.key === item.key) ? { ...item, saved: true } : item))
      setNotice('선택한 행동을 내 체크리스트에 담았어요.')
    } catch (error) { if (mounted.current) setNotice(errorMessage(error)) }
    finally { lock.current = false; if (mounted.current) setSaving(false) }
  }
  const count = actions.filter((item) => item.selected && !item.saved).length

  return <main id="main-content" className="roadmap-page">
    {!authenticated ? <section className="roadmap-empty"><img src={aiMascot} alt="" /><span>AI ROADMAP</span><h1>내 경험으로 다음 도전을 준비해요</h1><p>로드맵은 본인만 볼 수 있어요. 로그인하고 시작해 주세요.</p><button className="button button--primary" onClick={onLogin}>로그인하고 시작하기</button></section>
      : <>
      <header className="roadmap-heading"><div><span>AI ROADMAP · 나만 볼 수 있어요</span><h1>나의 다음 도전 로드맵</h1><p>내 경험 기록을 바탕으로 다음에 실천할 행동을 제안해 드려요.</p></div><img src={aiMascot} alt="" /></header>
      <section className="roadmap-controls" aria-label="로드맵 조건"><label><span>준비할 도전 유형</span><select value={type} disabled={busy} onChange={(event) => { setType(event.target.value as ChallengeCode | ''); setData(null); setActions([]); setLoadError(''); setGenerateError(''); setNotice(''); setEmpty(false); setLoading(Boolean(event.target.value)) }}>
        <option value="">도전 유형을 선택해 주세요</option>{Object.entries(challengeLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select></label><button className="button button--primary" disabled={!type || !availability?.available || busy || loading || Boolean(loadError)} onClick={() => void generate()}>{generating ? '로드맵 만드는 중…' : data ? '새 로드맵 만들기' : '로드맵 만들기'}</button>
        <p>{availability ? `내 경험 ${availability.myPostCount}개 · ${availability.available ? '새 로드맵을 만들 수 있어요.' : `${availability.needMore}개 더 기록하면 만들 수 있어요.`}` : availabilityError ? '생성 가능 여부를 확인하지 못했어요.' : '내 기록 수를 확인하고 있어요.'}</p>
      </section>
      {availabilityError && <div className="api-banner" role="alert"><span>{availabilityError}</span><button disabled={busy} onClick={() => setAvailabilityRetry((value) => value + 1)}>다시 확인</button></div>}
      {availability && !availability.available && <section className="roadmap-shortage"><h2>경험 기록이 {availability.needMore}개 더 필요해요</h2><p>내 경험이 3개 이상 모이면 다음 행동 로드맵을 만들 수 있어요. 저장된 로드맵은 유형을 골라 확인할 수 있어요.</p><button className="button button--secondary" onClick={onWrite}>경험 기록하러 가기</button></section>}
      {loading && <div className="roadmap-state" role="status">저장된 로드맵을 불러오고 있어요.</div>}
      {loadError && <div className="api-banner" role="alert"><span>{loadError}</span><button onClick={() => { setLoading(true); setLoadError(''); setLoadRetry((value) => value + 1) }}>다시 시도</button></div>}
      {generating && <div className="roadmap-state" role="status">경험 기록에서 다음 행동을 정리하고 있어요. 생성에는 잠시 시간이 걸릴 수 있어요.</div>}
      {generateError && <div className="api-banner" role="alert"><span>{generateError}{data ? ' 기존 로드맵은 유지돼요.' : ''}</span></div>}
      {!type && <div className="roadmap-state">도전 유형을 고르면 가장 최근에 저장한 로드맵을 확인할 수 있어요.</div>}
      {empty && !generating && !data && <div className="roadmap-state">이 유형의 저장된 로드맵이 아직 없어요. 로드맵 만들기를 눌러 시작해 보세요.</div>}
      {data && <>
        <div className="roadmap-result-meta"><h2>{challengeLabels[data.challengeType]} 준비 로드맵</h2><p>{data.createdAt.slice(0, 10).replaceAll('-', '. ')} 저장 · 위에서부터 순서대로 해 보세요. 담을 항목을 고르면 문장을 고칠 수 있어요.</p></div>
        <div className="roadmap-select-all"><button className="checklist-text-button" disabled={busy || actions.every((item) => item.saved)} onClick={() => { const all = actions.filter((item) => !item.saved).every((item) => item.selected); setActions((previous) => previous.map((item) => item.saved ? item : { ...item, selected: !all })) }}>{actions.filter((item) => !item.saved).every((item) => item.selected) ? '전체 선택 해제' : '전체 선택'}</button></div>
        <ol className="roadmap-timeline">{groupByPhase(actions).map((group, groupIndex) => <li className="roadmap-phase" key={`${group.phase}-${groupIndex}`}>
          <div className="roadmap-phase-marker" aria-hidden="true">{groupIndex + 1}</div>
          <div className="roadmap-phase-body"><h3><span>{groupIndex + 1}단계</span>{group.phase}</h3>
            {group.items.map((item) => <article className={`roadmap-action${item.selected ? ' selected' : ''}`} key={item.key}>
              <label><input type="checkbox" aria-label={`${group.phase}: ${item.content}`} checked={item.selected} disabled={busy || item.saved} onChange={() => setActions((previous) => previous.map((entry) => entry.key === item.key ? { ...entry, selected: !entry.selected } : entry))} /><span className="custom-check">{item.selected && <Check size={13} />}</span><span>{item.content}</span></label>
              {item.selected && <><input className="roadmap-edit-content" aria-label={`${group.phase} 문장 수정`} value={item.content} maxLength={100} disabled={busy || item.saved} onChange={(event) => setActions((previous) => previous.map((entry) => entry.key === item.key ? { ...entry, content: event.target.value } : entry))} />{item.saved && <small>체크리스트에 담았어요</small>}</>}
            </article>)}
          </div>
        </li>)}</ol>
        {!actions.length && <p className="roadmap-column-empty">제안된 단계가 없어요. 새 로드맵을 만들어 보세요.</p>}
        <section className="roadmap-add"><div><h2>다음 행동을 내 체크리스트로</h2><p>담은 단계는 체크리스트에서 순서대로 보여요. 완료 체크와 수정·삭제도 할 수 있어요.</p></div><button className="button button--primary" disabled={!count || busy} onClick={() => void save()}>{saving ? '담는 중…' : `선택한 ${count}개 담기`}</button><button className="button button--secondary" disabled={busy} onClick={onChecklist}>체크리스트 관리 <ChevronRight size={15} /></button></section>
        <p className="roadmap-note">생성한 로드맵은 자동 저장돼요. 문장 수정은 체크리스트에 담을 내용에 적용돼요. AI 제안은 참고 자료로 활용해 주세요.</p>
      </>}
      {notice && <div className="api-banner roadmap-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')}>닫기</button></div>}
    </>}
  </main>
}
