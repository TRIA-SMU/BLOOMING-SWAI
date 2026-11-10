import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { GoogleIcon } from '../components/GoogleIcon'
import { errorMessage } from '../api/client'
import { googleLoginUrl, validateNickname } from '../api/auth'
import bloomingSymbol from '../assets/blooming-symbol.png'
import './AuthPage.css'

export type AuthView = 'login' | 'signup' | 'nickname' | 'preview'
interface AuthPageProps {
  mode: AuthView
  error?: string
  initialNickname?: string
  required?: boolean
  onClose: () => void
  onLogout: () => void
  onPreview: () => void
  onSwitch: () => void
  onSave: (nickname: string) => Promise<void>
}

export function AuthPage({ mode, error, initialNickname = '', required = false, onClose, onLogout, onPreview, onSwitch, onSave }: AuthPageProps) {
  const [nickname, setNickname] = useState(initialNickname)
  const [fieldError, setFieldError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const login = mode === 'login' || mode === 'signup'
  const signup = mode === 'signup'
  const preview = mode === 'preview'
  const close = () => { if (!saving.current && !required) onClose() }

  useEffect(() => {
    document.getElementById('auth-title')?.focus()
    const resetBusy = () => setBusy(false)
    window.addEventListener('pageshow', resetBusy)
    return () => {
      window.removeEventListener('pageshow', resetBusy)
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

  return <main className="auth-page" id="auth-content" aria-labelledby="auth-title">
    <section className="auth-panel">
    <div className="auth-brand"><img src={bloomingSymbol} alt="" /><span>BLOOMING</span></div>
    <div className="auth-heading">
      <h1 id="auth-title" tabIndex={-1}>{login ? signup ? '경험 기록을 시작해요' : '다시 만나서 반가워요' : '어떤 이름으로 기록할까요?'}</h1>
      <p>{login ? signup ? '성공과 실패 모두 다음 도전을 위한 기록이 됩니다.' : '내 기록과 체크리스트를 이어서 확인해 보세요.' : '다른 사람에게는 이메일 대신 이 닉네임이 표시돼요.'}</p>
    </div>
    {login ? <>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="google-auth-button" disabled={busy} onClick={() => { setBusy(true); window.location.assign(googleLoginUrl()) }}>
        <GoogleIcon /><span>{busy ? 'Google로 이동 중…' : signup ? 'Google로 회원가입' : 'Google로 계속하기'}</span>
      </button>
      <p className="auth-switch">{signup ? '이미 계정이 있나요?' : '아직 계정이 없나요?'}<button onClick={onSwitch}>{signup ? '로그인' : '회원가입'}</button></p>
      <small>서비스에는 이메일 대신 닉네임만 공개돼요.</small>
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
      {required && <button className="auth-secondary" type="button" disabled={busy} onClick={onLogout}>로그아웃</button>}
    </form>}
    {!required && <button className="auth-back-link" onClick={close} disabled={busy}><ArrowLeft size={13} />게시판으로 돌아가기</button>}
    {import.meta.env.DEV && login && <button className="auth-preview-link" onClick={onPreview}>닉네임 화면 미리보기</button>}
    </section>
  </main>
}
