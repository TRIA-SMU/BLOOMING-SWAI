import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bookmark, Flag, Heart, SquarePen } from 'lucide-react'
import { GrowthIcon } from '../components/GrowthIcon'
import { ResultBadge } from '../components/ResultBadge'
import { ReportModal } from './ReportModal'
import type { Experience } from '../types/experience'
import './DetailModal.css'

interface DetailModalProps {
  item: Experience
  helped: boolean
  saved: boolean
  helpfulBusy?: boolean
  helpfulDisabled?: boolean
  error?: string
  currentUserId?: number
  onClose: () => void
  onToggleHelpful: () => void
  onToggleSave: () => void
  onWrite: () => void
  onReportSuccess?: () => void
}

export function DetailModal({ item, helped, saved, helpfulBusy = false, helpfulDisabled = false, error, currentUserId, onClose, onToggleHelpful, onToggleSave, onWrite, onReportSuccess }: DetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reportNotice, setReportNotice] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const isOwn = currentUserId != null && item.authorId === currentUserId
  useEffect(() => {
    if (!reportNotice) return
    const timer = window.setTimeout(() => setReportNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [reportNotice])

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  const sections = [
    ['잘된 점', item.content.good],
    ['아쉬운 점', item.content.regret],
    ['배운 점', item.content.learned],
    ['다음 도전에서 유지하거나 개선할 점', item.content.next],
  ]

  return <dialog ref={dialogRef} className="detail-modal" aria-labelledby="detail-title"
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
    }}>
    <article className="detail-page">
      <button className="back-link" onClick={onClose}><ArrowLeft size={19} />이전 화면으로 돌아가기</button>
      <header className="detail-header">
        <ResultBadge result={item.result} />
        <h1 id="detail-title">{item.title}</h1>
        {item.status === 'HIDDEN' && <p className="form-alert">검토 중인 글이에요. 작성자에게만 표시돼요.</p>}
        <div className="author-row"><span className="avatar">{item.nickname.slice(0, 1)}</span><strong>{item.nickname}</strong><span>{item.date}</span></div>
        <dl className="detail-meta">
          <div><dt>도전 유형</dt><dd>{item.type}</dd></div>
          <div><dt>진행 단계</dt><dd>{item.stage}</dd></div>
          <div><dt>주요 요인</dt><dd className="tag-row">{item.tags.map((tag) => <span className="factor-tag" key={tag}>{tag}</span>)}</dd></div>
        </dl>
      </header>
      <div className="article-body">{sections.map(([title, text], index) => <section className="article-section" key={title}>
        <span className="section-number">{String(index + 1).padStart(2, '0')}</span>
        <h2>{title}</h2><p>{text.trim() || '작성된 내용이 없어요.'}</p>
      </section>)}</div>
      <section className="reaction-card" aria-label="경험 반응">
        <div className="reaction-growth"><GrowthIcon stage={item.growth} /><div><span>현재 이 경험은</span><strong>{item.growth}으로 자라고 있어요</strong></div></div>
        <div className="reaction-action">
          <button className={`button helpful-button${helped ? ' helpful-button--active' : ''}`} disabled={helpfulBusy || helpfulDisabled} aria-pressed={helped} aria-busy={helpfulBusy} onClick={onToggleHelpful}><Heart size={19} />{helpfulBusy ? '반영 중…' : '도움이 돼요'}</button>
          {helpfulDisabled && <span>로그인한 다른 사람의 글에 반응할 수 있어요.</span>}
          <span aria-live="polite">{item.helpful}명이 도움을 받았어요</span>
        </div>
      </section>
      {error && <p className="detail-notice" role="alert">{error}</p>}
      <div className="detail-actions">
        <button className="text-button" onClick={onWrite}><SquarePen size={16} />내 경험도 기록하기</button>
        <div>
          <button className="text-button" aria-pressed={saved} onClick={onToggleSave}><Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />{saved ? '저장됨' : '저장'}</button>
          <button className="text-button text-button--muted" disabled={isOwn || currentUserId == null} onClick={() => setReportOpen(true)}><Flag size={15} />신고</button>
        </div>
      </div>
      {isOwn && <p className="own-report-note">내 글은 신고할 수 없어요.</p>}
      {reportNotice && <div className="report-toast" role="status">{reportNotice}</div>}
    </article>
    {reportOpen && <ReportModal postId={item.id} alreadyReported={reported} onClose={() => setReportOpen(false)}
      onDuplicate={() => setReported(true)}
      onSuccess={(message) => { setReportOpen(false); setReported(true); setReportNotice(message); onReportSuccess?.() }} />}
  </dialog>
}
