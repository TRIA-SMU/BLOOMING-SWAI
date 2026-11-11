export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TOKEN_KEY = 'blooming.token'

export const authToken = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: (token: string) => {
    try { localStorage.setItem(TOKEN_KEY, token) }
    catch { throw new Error('로그인을 저장하지 못했어요. 브라우저 저장소 설정을 확인해 주세요.') }
  },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY) } catch { /* 저장소를 사용할 수 없으면 이미 비로그인 상태다. */ } },
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = authToken.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  // 개발 사용자 헤더는 기본으로 넣지 않는다. 토큰이 없으면 서버 개발 모드에 맡긴다.
  if (options.body != null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError(0, '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
  if (!response.ok) {
    let message = `요청을 처리하지 못했어요. (${response.status})`
    try {
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') message = body.message
    } catch { /* 프록시의 비 JSON 오류도 HTTP 상태를 유지한다. */ }
    if (response.status === 401 && authToken.get() === token && !options.signal?.aborted) {
      authToken.clear()
      window.dispatchEvent(new Event('blooming:unauthorized'))
    }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청을 처리하지 못했어요.'
}
