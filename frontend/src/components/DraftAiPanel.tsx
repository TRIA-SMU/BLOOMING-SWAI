import { useEffect, useRef, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { draftAiApi, draftAiRequest, mergeSuggestedTags } from '../api/draftAi'
import type { DraftAiApi, DraftAiResponse, SuggestedTag } from '../api/draftAi'
import { ApiError, errorMessage } from '../api/client'
import { factorLabels } from '../data/writeOptions'
import type { ExperienceDraft } from '../utils/experienceDraft'
import './DraftAiPanel.css'

export function DraftAiPanel({ draft, disabled, onApply, onBusyChange, api = draftAiApi }: {
  draft: ExperienceDraft; disabled: boolean; onApply: (tags: SuggestedTag[]) => void
  onBusyChange: (busy: boolean) => void; api?: DraftAiApi
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ data: DraftAiResponse; fingerprint: string } | null>(null)
  const [selected, setSelected] = useState<SuggestedTag[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const controller = useRef<AbortController | null>(null)
  const requestId = useRef(0)
  const lock = useRef(false)
  useEffect(() => () => { requestId.current += 1; controller.current?.abort() }, [])
  let fingerprint = ''
  try { fingerprint = JSON.stringify(draftAiRequest(draft)) } catch { /* 본문 입력 전에는 요청하지 않는다. */ }
  const stale = result != null && result.fingerprint !== fingerprint
  const analyze = async () => {
    if (lock.current || disabled) return
    let snapshot: string
    try { snapshot = JSON.stringify(draftAiRequest(draft)) }
    catch (err) { setError(errorMessage(err)); return }
    lock.current = true; const id = ++requestId.current
    const current = new AbortController(); controller.current = current
    setBusy(true); onBusyChange(true); setError(''); setNotice(''); setResult(null); setSelected([])
    try {
      const data = await api.analyze(draft, current.signal)
      if (id !== requestId.current || current.signal.aborted) return
      setResult({ data, fingerprint: snapshot })
      setSelected(mergeSuggestedTags([], data.suggestedTags))
    } catch (err) {
      if (id !== requestId.current || current.signal.aborted) return
      setError(err instanceof ApiError && err.status === 503 ? 'AI 정리가 잠시 어려워요. 직접 작성하거나 잠시 후 다시 시도해 주세요.' : errorMessage(err))
    } finally {
      if (id === requestId.current) { lock.current = false; setBusy(false); onBusyChange(false) }
    }
  }
  const cancel = () => {
    requestId.current += 1; controller.current?.abort(); lock.current = false
    setBusy(false); onBusyChange(false); setNotice('AI 정리를 취소했어요. 입력한 글은 유지돼요.')
  }
  const apply = () => {
    if (!result || stale || disabled || busy || !selected.length) return
    onApply(mergeSuggestedTags(draft.factorTags, selected))
    setNotice('선택한 추천 태그를 기존 태그에 추가했어요. 글은 아직 저장되지 않았어요.')
  }
  const tags = result ? mergeSuggestedTags([], result.data.suggestedTags) : []
  return <section className="draft-ai-panel" aria-labelledby="draft-ai-title" aria-busy={busy}>
    <header><div><h2 id="draft-ai-title"><Sparkles size={18} />AI로 정리하기</h2><p>쓴 내용을 바탕으로 요약과 태그를 제안해요. 글을 자동으로 저장하거나 바꾸지 않아요.</p></div>
      {busy ? <button type="button" className="button button--secondary" onClick={cancel}>분석 취소</button> : <button type="button" className="button button--secondary" disabled={disabled} onClick={() => void analyze()}>{result ? '다시 정리하기' : 'AI로 정리하기'}</button>}
    </header>
    {busy && <p className="draft-ai-status" role="status">경험을 정리하고 있어요. 잠시만 기다려 주세요. 취소하면 직접 작성을 이어갈 수 있어요.</p>}
    {error && <p className="form-alert" role="alert">{error}</p>}
    {result && <div className="draft-ai-results">
      {stale && <p className="form-alert" role="status">분석 후 입력 내용이 바뀌었어요. 다시 정리하면 현재 글에 맞는 제안을 받을 수 있어요.</p>}
      <div><h3>한 줄 요약</h3><p>{result.data.summary || '요약 제안이 없어요.'}</p></div>
      <fieldset disabled={disabled || stale || busy}><legend>추천 요인 태그</legend><p className="field-hint">적용할 태그를 골라 주세요. 기존에 고른 태그는 유지돼요.</p><div className="chip-group">{tags.map((tag) => <label className={`select-chip${selected.includes(tag) ? ' select-chip--selected' : ''}`} key={tag}><input type="checkbox" aria-label={`AI 추천 ${factorLabels[tag]}`} checked={selected.includes(tag)} onChange={() => setSelected((previous) => previous.includes(tag) ? previous.filter((value) => value !== tag) : [...previous, tag])} /><span>{factorLabels[tag]}</span></label>)}</div>
        {!tags.length && <p>추천 태그가 없어요. 위의 요인 태그에서 직접 골라 주세요.</p>}
      </fieldset>
      <div><h3>핵심 배움</h3>{result.data.keyLessons.length ? <ul>{result.data.keyLessons.map((lesson, index) => <li key={index}>{lesson}</li>)}</ul> : <p>핵심 배움 제안이 없어요.</p>}</div>
      <div><h3>다음 도전을 위한 팁</h3><p>{result.data.nextTip || '다음 팁 제안이 없어요.'}</p></div>
      <div className="draft-ai-apply"><span>AI 제안은 참고용이에요. 내 경험에 맞는지 확인해 주세요.</span><button type="button" className="button button--primary" disabled={disabled || stale || busy || !selected.length} onClick={apply}><Check size={16} />선택한 태그 적용하기</button></div>
    </div>}
    {notice && <p className="draft-ai-status" role="status">{notice}</p>}
  </section>
}
