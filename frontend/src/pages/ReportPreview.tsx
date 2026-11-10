import { useState } from 'react'
import { ApiError } from '../api/client'
import { ReportModal } from './ReportModal'

// main.tsx의 DEV 분기에서만 사용한다. 실제 신고 API는 호출하지 않는다.
export function ReportPreview() {
  const initial = new URLSearchParams(window.location.search).get('state')
  const [mode, setMode] = useState(initial === 'duplicate' || initial === 'error' ? initial : 'success')
  const [open, setOpen] = useState(true)
  const [reported, setReported] = useState(initial === 'duplicate')
  const [notice, setNotice] = useState('')
  return <main className="page-container">
    <h1>신고 팝업 미리보기</h1>
    <p>디자인 확인용이며 실제 신고는 접수되지 않아요.</p>
    <label>확인할 상태 <select aria-label="미리보기 상태" value={mode} onChange={(event) => { setMode(event.target.value); setReported(event.target.value === 'duplicate'); setNotice('') }}>
      <option value="success">정상 접수</option><option value="duplicate">이미 신고함</option><option value="error">일반 오류</option>
    </select></label>
    <button className="button button--primary" onClick={() => setOpen(true)}>팝업 열기</button>
    {notice && <p role="status">{notice}</p>}
    {open && <ReportModal postId={0} alreadyReported={reported} onClose={() => setOpen(false)}
      onDuplicate={() => setReported(true)} onSuccess={(message) => { setOpen(false); setReported(true); setNotice(message) }}
      submitRequest={async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 400))
        if (mode === 'error') throw new ApiError(503, '일시적인 오류가 발생했어요. 입력 내용을 확인하고 다시 시도해 주세요.')
        return { message: '신고가 접수됐어요. (디자인 미리보기)' }
      }} />}
  </main>
}
