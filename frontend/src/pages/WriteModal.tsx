import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { GrowthIcon } from '../components/GrowthIcon'
import { challengeLabels, factorLabels, resultLabels, stageLabels } from '../data/writeOptions'
import { emptyDraft, validateDraft } from '../utils/experienceDraft'
import { errorMessage } from '../api/client'
import type { DraftErrors, ExperienceDraft } from '../utils/experienceDraft'
import { DraftAiPanel } from '../components/DraftAiPanel'
import type { DraftAiApi } from '../api/draftAi'
import './WriteModal.css'

interface WriteModalProps {
  draft: ExperienceDraft
  onChange: (draft: ExperienceDraft) => void
  onClose: () => void
  onComplete: (draft: ExperienceDraft) => Promise<void>
  mode?: 'create' | 'edit'
  aiApi?: DraftAiApi
}

function ChoiceGroup<T extends string>({ name, title, options, selected, error, multiple = false, onChange }: {
  name: string; title: string; options: Record<T, string>; selected: T[]; error?: string
  multiple?: boolean; onChange: (values: T[]) => void
}) {
  return <fieldset id={`field-${name}`} className="form-field choice-field" tabIndex={-1} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}>
    <legend className="field-label">{title}<span className="required-mark">필수</span></legend>
    {multiple && <p className="field-hint">경험에 영향을 준 요인을 1개 이상 골라주세요. 여러 개 선택할 수 있어요.</p>}
    <div className="chip-group">{(Object.entries(options) as [T, string][]).map(([value, label]) => <label key={value} className={`select-chip${selected.includes(value) ? ' select-chip--selected' : ''}`}>
      <input type={multiple ? 'checkbox' : 'radio'} name={name} value={value} aria-label={label} checked={selected.includes(value)}
        onChange={() => onChange(multiple ? selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] : [value])} />
      <span>{label}</span>
    </label>)}</div>
    {error && <p className="field-error" id={`${name}-error`}>{error}</p>}
  </fieldset>
}

export function WriteModal({ draft, onChange, onClose, onComplete, mode = 'create', aiApi }: WriteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const submitting = useRef(false)
  const [aiBusy, setAiBusy] = useState(false)
  const aiBusyRef = useRef(false)
  const handleAiBusy = useCallback((value: boolean) => { aiBusyRef.current = value; setAiBusy(value) }, [])
  const [initialDraft] = useState(draft)
  const errors: DraftErrors = submitted ? validateDraft(draft) : {}
  const dirty = JSON.stringify(draft) !== JSON.stringify(mode === 'edit' ? initialDraft : emptyDraft())

  useEffect(() => {
    const dialog = dialogRef.current
    const focused = document.activeElement
    const overflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = overflow
      if (focused instanceof HTMLElement) focused.focus()
    }
  }, [])

  const close = () => { if (submitting.current || aiBusyRef.current) return; if (dirty) setDiscardOpen(true); else onClose() }
  const update = <K extends keyof ExperienceDraft>(key: K, value: ExperienceDraft[K]) => onChange({ ...draft, [key]: value })
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting.current || aiBusyRef.current) return
    setSubmitted(true)
    const validation = validateDraft(draft)
    const first = Object.keys(validation)[0]
    if (first) {
      document.getElementById(`field-${first}`)?.focus()
      return
    }
    submitting.current = true
    setSaving(true)
    setSaveError('')
    try { await onComplete(draft) }
    catch (error) { setSaveError(errorMessage(error)) }
    finally { submitting.current = false; setSaving(false) }
  }
  const textFields = [
    { key: 'goodPoints', label: '잘된 점', hint: '예: 매주 역할과 진행 상황을 공유해 마감 일정을 지킬 수 있었어요.' },
    { key: 'badPoints', label: '아쉬운 점', hint: '예: 실제 사용자의 이야기를 충분히 듣지 못했어요.' },
    { key: 'lessons', label: '배운 점', hint: '예: 작은 사용자 조사도 팀의 방향을 확인하는 데 도움이 됐어요.' },
    { key: 'nextPlan', label: '다음 도전에서 유지하거나 개선할 점', hint: '예: 역할 공유는 유지하고, 첫 주에 사용자 인터뷰를 시작하려고 해요.' },
  ] as const

  return <dialog ref={dialogRef} className="write-modal" aria-labelledby="write-title"
    onCancel={(event) => { event.preventDefault(); close() }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
    }}>
    {discardOpen ? <section className="draft-exit" aria-labelledby="draft-exit-title">
      <h2 id="draft-exit-title">{mode === 'edit' ? '수정을 그만둘까요?' : '작성을 잠시 멈출까요?'}</h2><p>{mode === 'edit' ? '저장하지 않은 수정 내용은 사라지고 기존 글은 유지돼요.' : '닫아도 입력한 내용은 이 화면을 새로고침하기 전까지 유지돼요.'}</p>
      <div><button className="button button--secondary" onClick={() => setDiscardOpen(false)} autoFocus>계속 작성하기</button><button className="button button--primary" onClick={onClose}>닫기</button></div>
    </section> : <>
      <header className="write-heading"><button className="back-link" onClick={close}><ArrowLeft size={19} />{mode === 'edit' ? '마이페이지로 돌아가기' : '게시판으로 돌아가기'}</button>
        <p className="eyebrow">나의 경험을 다음 사람의 힌트로</p><h1 id="write-title">{mode === 'edit' ? '경험 수정하기' : '경험 기록하기'}</h1>
        <p>완벽하게 정리하지 않아도 괜찮아요. 기억나는 만큼 천천히 남겨보세요.</p>
      </header>
      <form className="write-form" onSubmit={submit} noValidate aria-busy={saving}>
        {saveError && <div className="form-alert" role="alert">{saveError} 입력한 내용은 유지돼요.</div>}
        <fieldset className="write-pending-fields" disabled={saving || aiBusy}>
        {submitted && Object.keys(errors).length > 0 && <div className="form-alert" role="alert">필수 항목을 확인해 주세요. 나머지 내용은 편한 만큼 작성해도 괜찮아요.</div>}
        <section className="form-section" aria-labelledby="intro-heading">
          <div className="form-section-heading"><span>01</span><div><h2 id="intro-heading">도전을 소개해 주세요</h2><p>어떤 경험이었는지 알아볼 수 있는 기본 정보예요.</p></div></div>
          <div className="form-field">
            <label className="field-label" htmlFor="field-title">제목<span className="required-mark">필수</span></label>
            <div className="title-input-wrap"><input id="field-title" className="text-input" value={draft.title} maxLength={100} required
              aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error title-count' : 'title-count'}
              onChange={(event) => update('title', event.target.value)} placeholder="예: 첫 공모전 본선에서 배운 사용자 조사의 중요성" />
              <span className="character-count" id="title-count">{draft.title.length}/100</span></div>
            {errors.title && <p className="field-error" id="title-error">{errors.title}</p>}
          </div>
          <div className="form-grid">
            <ChoiceGroup name="resultType" title="결과" options={resultLabels} selected={draft.resultType ? [draft.resultType] : []} error={errors.resultType}
              onChange={([value]) => onChange({ ...draft, resultType: value, factorTags: draft.resultType === value ? draft.factorTags : [] })} />
            <ChoiceGroup name="challengeType" title="도전 유형" options={challengeLabels} selected={draft.challengeType ? [draft.challengeType] : []} error={errors.challengeType} onChange={([value]) => update('challengeType', value)} />
          </div>
          <ChoiceGroup name="stage" title="진행 단계" options={stageLabels} selected={draft.stage ? [draft.stage] : []} error={errors.stage} onChange={([value]) => update('stage', value)} />
          <ChoiceGroup name="factorTags" title="요인 태그" options={factorLabels} selected={draft.factorTags} multiple error={errors.factorTags} onChange={(values) => update('factorTags', values)} />
        </section>
        <section className="form-section" aria-labelledby="reflection-heading">
          <div className="form-section-heading"><span>02</span><div><h2 id="reflection-heading">경험을 돌아봐 주세요</h2><p>짧은 문장도 충분해요. 솔직한 기록이 가장 좋은 힌트가 됩니다.</p></div></div>
          {textFields.map(({ key, label, hint }) => <div className="form-field" key={key}>
            <label className="field-label" htmlFor={`field-${key}`}>{label}<span className={key === 'lessons' ? 'required-mark' : 'optional-mark'}>{key === 'lessons' ? '필수' : '선택'}</span></label>
            <textarea id={`field-${key}`} value={draft[key]} onChange={(event) => update(key, event.target.value)} placeholder={hint}
              required={key === 'lessons'} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} />
            {errors[key] && <p className="field-error" id={`${key}-error`}>{errors[key]}</p>}
          </div>)}
        </section>
        </fieldset>
        <DraftAiPanel draft={draft} disabled={saving} onApply={(factorTags) => onChange({ ...draft, factorTags })} onBusyChange={handleAiBusy} api={aiApi} />
        <footer className="form-footer"><p><GrowthIcon stage="씨앗" size="sm" />{mode === 'edit' ? '받은 반응과 성장 단계는 유지돼요.' : '기록한 경험은 작은 씨앗에서 시작해요.'}</p><div>
          <button type="button" className="button button--secondary" disabled={saving || aiBusy} onClick={close}>취소</button><button className="button button--primary" type="submit" disabled={saving || aiBusy}>{mode === 'edit' ? saving ? '저장 중…' : '수정 내용 저장하기' : saving ? '등록 중…' : '경험 등록하기'}</button>
        </div></footer>
      </form>
    </>}
  </dialog>
}
