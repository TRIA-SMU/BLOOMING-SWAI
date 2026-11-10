import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import { GoogleIcon } from '../components/GoogleIcon'
import { errorMessage } from '../api/client'
import { googleLoginUrl, validateNickname } from '../api/auth'
import bloomingSymbol from '../assets/blooming-symbol.png'
import './AuthModal.css'

export type AuthView = 'login' | 'nickname' | 'preview'
interface AuthModalProps {
  mode: AuthView
  error?: string
  initialNickname?: string
  required?: boolean
  onClose: () => void
  onLogout: () => void
  onPreview: () => void
  onSave: (nickname: string) => Promise<void>
}

export function AuthModal({ mode, error, initialNickname = '', required = false, onClose, onLogout, onPreview, onSave }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [nickname, setNickname] = useState(initialNickname)
  const [fieldError, setFieldError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const login = mode === 'login'
  const preview = mode === 'preview'
  const close = () => { if (!saving.current && !required) onClose() }

  useEffect(() => {
    const dialog = dialogRef.current
    const focused = document.activeElement
    const overflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    const resetBusy = () => setBusy(false)
    window.addEventListener('pageshow', resetBusy)
    return () => {
      window.removeEventListener('pageshow', resetBusy)
      dialog?.close()
      document.body.style.overflow = overflow
      if (focused instanceof HTMLElement) focused.focus()
    }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving.current) return
    setSubmitted(true)
    const validation = validateNickname(nickname)
    setFieldError(validation)
    if (validation) { document.getElementById('nickname-input')?.focus(); return }
    saving.current = true
    setBusy(true)
    try { await onSave(nickname.trim()) }
    catch (reason) { setFieldError(errorMessage(reason)) }
    finally { saving.current = false; setBusy(false) }
  }

  return <dialog ref={dialogRef} className="auth-modal" aria-labelledby="auth-title" aria-describedby="auth-description"
    onCancel={(event) => { event.preventDefault(); close() }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
    }}>
    {!required && <button className="auth-close" aria-label="닫기" onClick={close} disabled={busy}><X size={20} /></button>}
    <div className="auth-brand"><img src={bloomingSymbol} alt="" /><span>BLOOMING</span></div>
    <div className="auth-intro">
      <p className="auth-eyebrow">{login ? '나의 경험에서, 우리의 다음으로' : preview ? '닉네임 화면 미리보기' : required ? 'BLOOMING에 오신 걸 환영해요' : '나를 소개하는 이름'}</p>
      <h1 id="auth-title">{login ? <>모든 경험이<br />다음 도전의 씨앗으로</> : '어떤 이름으로 기록할까요?'}</h1>
      <p id="auth-description">{login ? <>경험을 기록하고, 다른 사람의 도전에서<br />나에게 필요한 힌트를 찾아보세요.</> : '다른 사람에게는 이메일 대신 이 닉네임이 표시돼요.'}</p>
    </div>
    {login ? <>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="google-login-button" disabled={busy} onClick={() => { setBusy(true); window.location.assign(googleLoginUrl()) }}>
        <GoogleIcon /><span>{busy ? 'Google로 이동 중…' : 'Google로 계속하기'}</span>
      </button>
      <p className="auth-privacy">처음이라면 같은 버튼으로 가입할 수 있어요.<br />서비스에는 닉네임만 공개돼요.</p>
      {import.meta.env.DEV && <button className="auth-preview-link" onClick={onPreview}>닉네임 화면 미리보기</button>}
    </> : <form onSubmit={submit} noValidate aria-busy={busy}>
      {preview && <p className="auth-preview-note">디자인 확인용 화면이에요. 실제 계정은 변경되지 않아요.</p>}
      <label className="nickname-label" htmlFor="nickname-input">닉네임</label>
      <div className={`nickname-input-wrap${fieldError ? ' nickname-input-wrap--error' : ''}`}>
        <input id="nickname-input" value={nickname} maxLength={12} minLength={2} required autoComplete="nickname" autoFocus
          placeholder="예: 새벽코딩" disabled={busy} aria-invalid={Boolean(fieldError)} aria-describedby="nickname-hint nickname-error"
          onChange={(event) => { setNickname(event.target.value); setFieldError(submitted ? validateNickname(event.target.value) : '') }} />
        <span>{nickname.length}/12</span>
      </div>
      <p id="nickname-hint" className="nickname-hint">2~12자로 입력해 주세요.</p>
      <p id="nickname-error" className="nickname-error" role="alert">{fieldError}</p>
      <button className="button button--primary nickname-submit" type="submit" disabled={busy}>
        {busy ? '저장 중…' : preview ? <><Check size={17} />화면 확인</> : required ? '시작하기' : '닉네임 저장'}
      </button>
      {required ? <button className="auth-secondary" type="button" disabled={busy} onClick={onLogout}>로그아웃</button>
        : preview ? <button className="auth-secondary" type="button" onClick={onClose}><ArrowLeft size={14} />돌아가기</button> : null}
    </form>}
  </dialog>
}
