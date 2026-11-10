import { API_BASE_URL, apiRequest, authToken } from './client.ts'
import type { Me } from './posts'

const NICKNAME_KEY = 'blooming.nickname-required'

export function needsNickname() {
  try { return Boolean(authToken.get()) && localStorage.getItem(NICKNAME_KEY) === 'true' }
  catch { return false }
}

export function finishNickname() {
  localStorage.removeItem(NICKNAME_KEY)
}

export function clearSession() {
  authToken.clear()
  try { localStorage.removeItem(NICKNAME_KEY) } catch { /* 사용 불가능한 저장소 */ }
}

// 렌더·외부 리소스 요청 전에 호출한다. 쿼리의 토큰은 브라우저 주소에 남기지 않는다.
export function consumeOAuthCallback(url: string, replaceUrl: (url: string) => void) {
  const parsed = new URL(url)
  if (parsed.pathname !== '/oauth/callback') return { error: '', callback: false }
  const token = parsed.searchParams.get('token')?.trim()
  const error = parsed.searchParams.get('error')
  replaceUrl('/')
  if (error || !token) {
    clearSession()
    return { callback: true, error: error === 'no_email' ? '이메일을 확인할 수 없는 구글 계정이에요. 다른 계정으로 시도해 주세요.' : '로그인을 완료하지 못했어요. 다시 시도해 주세요.' }
  }
  try {
    authToken.set(token)
    if (parsed.searchParams.get('newUser') === 'true') localStorage.setItem(NICKNAME_KEY, 'true')
    else finishNickname()
    return { error: '', callback: true }
  } catch (reason) {
    clearSession()
    return { callback: true, error: reason instanceof Error ? reason.message : '로그인을 저장하지 못했어요.' }
  }
}

export function googleLoginUrl() {
  // 로컬에서는 Spring의 OAuth 콜백 주소가 8080으로 만들어지도록 백엔드로 직접 이동한다.
  const base = (import.meta.env?.VITE_AUTH_BASE_URL || API_BASE_URL || (import.meta.env?.DEV ? 'http://localhost:8080' : '')).replace(/\/$/, '')
  return `${base}/oauth2/authorization/google`
}

export function validateNickname(nickname: string) {
  const value = nickname.trim()
  if (value.length < 2 || value.length > 12) return '닉네임은 2~12자로 입력해 주세요.'
  return ''
}

export const authApi = {
  changeNickname: (nickname: string) => apiRequest<Me>('/api/me/nickname', { method: 'PATCH', body: JSON.stringify({ nickname: nickname.trim() }) }),
}
