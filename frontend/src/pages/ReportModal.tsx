import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ApiError, errorMessage } from '../api/client'
import { buildReportRequest, reportApi, reportReasons } from '../api/report'
import type { ReportReason, ReportRequest } from '../api/report'
import './ReportModal.css'

interface ReportModalProps {
  postId: number
  alreadyReported?: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onDuplicate: () => void
  submitRequest?: (postId: number, request: ReportRequest) => Promise<{ message: string }>
}

export function ReportModal({ postId, alreadyReported = false, onClose, onSuccess, onDuplicate, submitRequest = reportApi.submit }: ReportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const lock = useRef(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const close = () => { if (!lock.current) onClose() }

  useEffect(() => {
    const dialog = dialogRef.current
    const focused = document.activeElement
    const overflow = document.body.style.overflow
    const parentModal = dialog?.parentElement?.closest('dialog[open]')
    dialog?.showModal()
    dialog?.focus()
    if (!parentModal) document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      if (!parentModal) document.body.style.overflow = overflow
      if (focused instanceof HTMLElement && focused.isConnected) focused.focus()
    }
  }, [])

  const submit = async () => {
    if (!reason || lock.current || alreadyReported) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const response = await submitRequest(postId, buildReportRequest(reason, detail))
      onSuccess(response.message)
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409) onDuplicate()
      else setError(errorMessage(failure))
    } finally { lock.current = false; setBusy(false) }
  }

  return <dialog ref={dialogRef} className="report-modal" tabIndex={-1} aria-labelledby="report-title" aria-describedby="report-description" aria-busy={busy}
    onCancel={(event) => { event.preventDefault(); event.stopPropagation(); close() }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
    }}>
    <div className="report-modal-heading"><div>
      <h2 id="report-title">이 경험을 신고할까요?</h2>
      <p id="report-description">신고 사유를 선택해 주세요. 접수된 내용은 검토 후 처리됩니다.</p>
    </div><button onClick={close} aria-label="신고 팝업 닫기" disabled={busy}><X size={19} /></button></div>
    {alreadyReported ? <div className="report-state-message" role="status">이미 신고한 글이에요.</div> : <>
      <fieldset className="report-reasons" disabled={busy}><legend className="sr-only">신고 사유</legend>
        {(Object.entries(reportReasons) as [ReportReason, string][]).map(([code, label]) => <label key={code}>
          <input type="radio" name="report-reason" value={code} checked={reason === code} onChange={() => { setReason(code); setError('') }} />
          <span className="radio-mark" aria-hidden="true" /><span>{label}</span>
        </label>)}
      </fieldset>
      {reason === 'ETC' && <label className="report-detail-field">
        <span>상세 설명 <small>선택</small></span>
        <textarea value={detail} maxLength={200} disabled={busy} onChange={(event) => setDetail(event.target.value)}
          placeholder="검토에 참고할 내용을 입력해 주세요." aria-describedby="report-detail-count" />
        <small id="report-detail-count">{detail.length} / 200</small>
      </label>}
      {error && <p className="report-error" role="alert">{error}</p>}
    </>}
    <div className="report-actions">
      <button className="button button--secondary" onClick={close} disabled={busy}>취소</button>
      <button className="button button--primary" disabled={!reason || busy || alreadyReported} onClick={() => void submit()}>{busy ? '접수 중…' : '신고하기'}</button>
    </div>
  </dialog>
}
