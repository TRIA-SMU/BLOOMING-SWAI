import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { checklistApi } from '../api/checklist'
import type { ChecklistApi, ChecklistItem } from '../api/checklist'
import type { ChallengeCode } from '../api/posts'
import { errorMessage } from '../api/client'
import { challengeLabels } from '../data/writeOptions'
import './ChecklistPage.css'

const sourceLabels = { INSIGHT: '요인 분석', ROADMAP: 'AI 로드맵', CUSTOM: '직접 추가' }
export function ChecklistPage({ authenticated, onLogin, onAnalysis, api = checklistApi }: {
  authenticated: boolean; onLogin: () => void; onAnalysis: () => void; api?: ChecklistApi
}) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [notice, setNotice] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<ChallengeCode | ''>('')
  const [filter, setFilter] = useState<ChallengeCode | 'ALL' | 'GENERAL'>('ALL')
  const [edit, setEdit] = useState<{ id: number; content: string } | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const lifetime = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authenticated) return
    const controller = new AbortController()
    lifetime.current = controller
    api.list(controller.signal).then((result) => { if (!controller.signal.aborted) setItems(result.items) })
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [authenticated, api, retry])

  const mutate = async (action: () => Promise<void>) => {
    if (lock.current) return
    lock.current = true; setBusy(true); setNotice('')
    try { await action() }
    catch (error) { if (!lifetime.current?.signal.aborted) setNotice(errorMessage(error)) }
    finally { lock.current = false; if (!lifetime.current?.signal.aborted) setBusy(false) }
  }
  const create = () => mutate(async () => {
    const item = await api.create(content, type || null)
    if (lifetime.current?.signal.aborted) return
    setItems((previous) => [...previous, item]); setContent(''); setFilter('ALL'); setNotice('준비 항목을 추가했어요.'); inputRef.current?.focus()
  })
  const update = (id: number, values: { content?: string; done?: boolean }) => mutate(async () => {
    const result = await api.update(id, values)
    if (lifetime.current?.signal.aborted) return
    setItems((previous) => previous.map((item) => item.id === id ? result : item))
    if (values.content != null) { setEdit(null); setNotice('준비 항목을 수정했어요.') }
  })
  const remove = (id: number) => mutate(async () => {
    await api.remove(id)
    if (lifetime.current?.signal.aborted) return
    setItems((previous) => previous.filter((item) => item.id !== id)); setDeleteId(null)
    if (edit?.id === id) setEdit(null)
    setNotice('준비 항목을 삭제했어요.')
  })
  const doneCount = items.filter((item) => item.done).length
  const visible = items.filter((item) => filter === 'ALL' || (filter === 'GENERAL' ? item.challengeType == null : item.challengeType === filter))
  const groups = [...new Set(visible.map((item) => item.challengeType))].map((challengeType) => ({
    challengeType, items: visible.filter((item) => item.challengeType === challengeType),
  }))

  return <main id="main-content" className="checklist-page">
    <header className="feature-heading checklist-heading"><div><span className="feature-icon"><Pin size={20} /></span><div><h1>나의 준비 체크리스트</h1><p>분석에서 저장한 준비 항목을 한곳에서 확인하고 완료해 보세요.</p></div></div>
      <button className="button button--secondary" onClick={onAnalysis}>새 분석 시작하기</button>
    </header>
    {!authenticated ? <section className="checklist-guide"><span className="guide-mark"><Pin size={20} /></span><h2>내 준비 항목을 이어서 확인해요</h2><p>체크리스트는 본인만 볼 수 있어요. 로그인 후 확인해 주세요.</p><button className="button button--primary" onClick={onLogin}>로그인하고 확인하기</button></section>
      : loading ? <section className="checklist-guide" role="status"><h2>체크리스트를 불러오고 있어요</h2></section>
        : loadError ? <section className="checklist-guide" role="alert"><h2>체크리스트를 불러오지 못했어요</h2><p>{loadError}</p><button className="button button--secondary" onClick={() => { setLoading(true); setLoadError(''); setRetry((value) => value + 1) }}>다시 시도</button></section>
          : <>
      <form className="checklist-add" onSubmit={(event) => { event.preventDefault(); void create() }} aria-label="준비 항목 추가">
        <label><span>도전 유형</span><select value={type} disabled={busy} onChange={(event) => setType(event.target.value as ChallengeCode | '')}><option value="">공통 준비</option>{Object.entries(challengeLabels).map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label>
        <label className="checklist-add-content"><span>새 준비 항목</span><input ref={inputRef} value={content} disabled={busy} maxLength={100} required placeholder="다음 도전을 위해 할 일을 적어 보세요" onChange={(event) => setContent(event.target.value)} /></label>
        <button className="button button--primary" disabled={busy || !content.trim()}><Plus size={16} />추가하기</button>
      </form>
      <div className="checklist-toolbar"><p aria-live="polite">전체 <strong>{items.length}개</strong> 중 <strong>{doneCount}개</strong> 완료</p><label><span className="sr-only">도전 유형별 체크리스트</span><select value={filter} disabled={busy || edit != null || deleteId != null} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="ALL">모든 도전 유형</option><option value="GENERAL">공통 준비</option>{Object.entries(challengeLabels).map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label></div>
      {!items.length ? <section className="checklist-guide"><span className="guide-mark"><Pin size={20} /></span><h2>저장된 체크리스트가 아직 없어요</h2><p>도전 요인 분석에서 항목을 담거나 위에서 준비할 일을 직접 추가해 보세요.</p><button className="button button--secondary" onClick={onAnalysis}>도전 요인 분석하기</button></section>
        : !visible.length ? <section className="checklist-guide"><h2>이 유형의 준비 항목은 아직 없어요</h2><button className="button button--secondary" onClick={() => setFilter('ALL')}>모든 항목 보기</button></section>
          : <div className="checklist-board">{groups.map((group) => {
            const done = group.items.filter((item) => item.done).length
            const progress = Math.round(done * 100 / group.items.length)
            const label = group.challengeType ? challengeLabels[group.challengeType] : '공통'
            return <section className="checklist-plan" key={group.challengeType ?? 'GENERAL'} aria-label={`${label} 준비`}>
              <div className="checklist-plan-head"><div><span>{label}</span><h2>{label} 준비</h2></div><strong>{progress}%</strong></div>
              <div className="checklist-progress" role="progressbar" aria-label={`${label} 준비 완료율`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><p>전체 {group.items.length}개 중 {done}개 완료</p>
              <div className="checklist-items">{group.items.map((item) => <div className="checklist-item" key={item.id}>
                {edit?.id === item.id ? <form className="checklist-edit" aria-label="준비 항목 수정" onSubmit={(event) => { event.preventDefault(); void update(item.id, { content: edit.content }) }}>
                  <label><span className="sr-only">수정할 준비 항목</span><input autoFocus value={edit.content} maxLength={100} required disabled={busy} onChange={(event) => setEdit({ id: item.id, content: event.target.value })} onKeyDown={(event) => { if (event.key === 'Escape' && !busy) setEdit(null) }} /></label>
                  <div><button className="checklist-text-button" disabled={busy || !edit.content.trim()}>저장</button><button type="button" className="checklist-text-button" disabled={busy} onClick={() => setEdit(null)}>취소</button></div>
                </form> : <>
                  <label className={item.done ? 'checked' : ''}><input type="checkbox" checked={item.done} disabled={busy || edit != null || deleteId != null} onChange={() => void update(item.id, { done: !item.done })} /><span className="custom-check">{item.done && <Check size={14} />}</span><span>{item.content}</span></label>
                  <div className="checklist-item-meta"><small>{sourceLabels[item.source]}</small><div><button aria-label={`${item.content} 수정`} disabled={busy || edit != null || deleteId != null} onClick={() => { setEdit({ id: item.id, content: item.content }); setNotice('') }}><Pencil size={14} /></button><button aria-label={`${item.content} 삭제`} disabled={busy || edit != null || deleteId != null} onClick={() => { setDeleteId(item.id); setNotice('') }}><Trash2 size={14} /></button></div></div>
                </>}
                {deleteId === item.id && <div className="checklist-delete" role="group" aria-label="준비 항목 삭제 확인"><p>이 준비 항목을 삭제할까요?</p><button className="checklist-text-button" disabled={busy} onClick={() => void remove(item.id)}>삭제하기</button><button className="checklist-text-button" disabled={busy} onClick={() => setDeleteId(null)}>취소</button></div>}
              </div>)}</div>
            </section>
          })}</div>}
    </>}
    {notice && <div className="api-banner checklist-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')}>닫기</button></div>}
  </main>
}
