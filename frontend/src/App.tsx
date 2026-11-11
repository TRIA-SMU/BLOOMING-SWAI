import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { BoardPage } from './pages/BoardPage'
import { HomePage } from './pages/HomePage'
import { AnalysisPage } from './pages/AnalysisPage'
import { ChecklistPage } from './pages/ChecklistPage'
import { MyPage } from './pages/MyPage'
import { RoadmapPage } from './pages/RoadmapPage'
import { DetailModal } from './pages/DetailModal'
import { WriteModal } from './pages/WriteModal'
import { AuthPage } from './pages/AuthPage'
import type { AuthView } from './pages/AuthPage'
import { detailToExperience, postsApi } from './api/posts'
import type { HelpfulResponse, Me, ResultCode } from './api/posts'
import { authToken, errorMessage } from './api/client'
import { authApi, clearSession, finishNickname, needsNickname } from './api/auth'
import { emptyDraft } from './utils/experienceDraft'
import type { ExperienceDraft } from './utils/experienceDraft'
import type { Experience } from './types/experience'
import aiMascot from './assets/ai-mascot-clean.png'
import './App.css'

function App({ initialAuthError = '', previewNickname = false }: { initialAuthError?: string; previewNickname?: boolean }) {
  const [screen, setScreen] = useState<'home' | 'board' | 'analysis' | 'checklist' | 'mypage' | 'roadmap'>(() => window.location.hash === '#roadmap' ? 'roadmap' : window.location.hash === '#mypage' ? 'mypage' : window.location.hash === '#checklist' ? 'checklist' : window.location.hash === '#analysis' ? 'analysis' : window.location.hash === '#board' ? 'board' : 'home')
  useEffect(() => {
    const syncScreen = () => {
      const hash = window.location.hash
      if (hash && hash !== '#home' && hash !== '#board' && hash !== '#analysis' && hash !== '#checklist' && hash !== '#mypage' && hash !== '#roadmap') return
      setScreen(hash === '#roadmap' ? 'roadmap' : hash === '#mypage' ? 'mypage' : hash === '#checklist' ? 'checklist' : hash === '#analysis' ? 'analysis' : hash === '#board' ? 'board' : 'home')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', syncScreen)
    return () => window.removeEventListener('hashchange', syncScreen)
  }, [])
  const [notice, setNotice] = useState('')
  const [me, setMe] = useState<Me | null>(null)
  const [meError, setMeError] = useState('')
  const [meRetry, setMeRetry] = useState(0)
  const [hasSession, setHasSession] = useState(() => Boolean(authToken.get()))
  const [sessionStatus, setSessionStatus] = useState<'guest' | 'checking' | 'authenticated'>(() => authToken.get() ? 'checking' : 'guest')
  const [authView, setAuthView] = useState<AuthView | null>(previewNickname ? 'preview' : initialAuthError ? 'login' : null)
  const [authError, setAuthError] = useState(initialAuthError)
  const pendingAction = useRef<{ type: 'write' } | { type: 'detail'; id: number } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Experience | null>(null)
  const [helpful, setHelpful] = useState<HelpfulResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailRetry, setDetailRetry] = useState(0)
  const [helpfulBusy, setHelpfulBusy] = useState(false)
  const reactionLock = useRef(false)
  const [reactionError, setReactionError] = useState('')
  // 저장 API는 아직 없으므로 북마크만 화면 내 임시 상태로 남겨 둔다.
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [writeOpen, setWriteOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [boardVersion, setBoardVersion] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [initialResult, setInitialResult] = useState<ResultCode>('SUCCESS')
  const authenticated = sessionStatus === 'authenticated' && me != null

  const resumePending = useCallback(() => {
    const pending = pendingAction.current
    pendingAction.current = null
    if (pending?.type === 'write') setWriteOpen(true)
    if (pending?.type === 'detail') {
      setSelected(null); setHelpful(null); setDetailError(''); setReactionError(''); setDetailLoading(true)
      setSelectedId(pending.id); setDetailRetry((value) => value + 1)
    }
  }, [])

  useEffect(() => {
    if (!hasSession) return
    const controller = new AbortController()
    postsApi.me(controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return
        setMe(user); setMeError(''); setAuthError(''); setSessionStatus('authenticated')
        if (needsNickname()) setAuthView('nickname')
        else { setAuthView((current) => current === 'preview' ? current : null); resumePending() }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setMe(null); setMeError(errorMessage(error)); setSessionStatus('guest')
      })
    return () => controller.abort()
  }, [hasSession, meRetry, resumePending])

  useEffect(() => {
    const requireLogin = () => {
      if (writeOpen) pendingAction.current = { type: 'write' }
      else if (selectedId != null) pendingAction.current = { type: 'detail', id: selectedId }
      clearSession(); setHasSession(false); setMe(null); setSessionStatus('guest'); setSavedIds([])
      setWriteOpen(false); setSelectedId(null); setSelected(null); setDetailLoading(false); setDetailError('')
      setAuthError('로그인이 만료됐어요. 다시 로그인해 주세요.'); setAuthView('login')
    }
    window.addEventListener('blooming:unauthorized', requireLogin)
    return () => window.removeEventListener('blooming:unauthorized', requireLogin)
  }, [writeOpen, selectedId])

  useEffect(() => {
    if (selectedId == null) return
    const controller = new AbortController()
    Promise.all([postsApi.detail(selectedId, controller.signal), postsApi.helpful(selectedId, controller.signal)])
      .then(([post, reaction]) => {
        if (controller.signal.aborted) return
        setSelected(detailToExperience({ ...post, helpfulCount: reaction.helpfulCount, growthStage: reaction.growthStage }))
        setHelpful(reaction)
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setDetailError(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false) })
    return () => controller.abort()
  }, [selectedId, detailRetry])

  const closeDetail = () => { setSelectedId(null); setSelected(null); setHelpful(null); setDetailLoading(false); setDetailError('') }
  const openDetail = (id: number) => {
    if (!authenticated || needsNickname()) { pendingAction.current = { type: 'detail', id }; setAuthView(authenticated ? 'nickname' : 'login'); return }
    setSelected(null); setHelpful(null); setDetailError(''); setReactionError(''); setDetailLoading(true); setSelectedId(id)
    setDetailRetry((value) => value + 1)
  }
  const retryDetail = () => { setDetailError(''); setDetailLoading(true); setDetailRetry((value) => value + 1) }
  const openWrite = () => {
    if (!authenticated || needsNickname()) { pendingAction.current = { type: 'write' }; setAuthView(authenticated ? 'nickname' : 'login'); return }
    closeDetail(); setWriteOpen(true); setNotice('')
  }
  const logout = () => {
    clearSession(); setHasSession(false); setMe(null); setMeError(''); setSessionStatus('guest'); setAuthError('')
    closeDetail(); setWriteOpen(false); setAuthView(null); setSavedIds([]); pendingAction.current = null
    setDraft(emptyDraft()); setRefreshKey((value) => value + 1); setNotice('로그아웃했어요.')
  }
  const closeAuth = () => {
    setAuthView(null); setAuthError(''); pendingAction.current = null
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')) window.history.replaceState(null, '', '/')
  }
  const saveNickname = async (nickname: string) => {
    if (authView === 'preview') { closeAuth(); setNotice('디자인 미리보기를 확인했어요. 실제 계정은 변경하지 않았어요.'); return }
    const user = await authApi.changeNickname(nickname)
    finishNickname(); setMe(user); setAuthView(null); setNotice('닉네임을 저장했어요.'); resumePending()
  }
  const completeWrite = async (values: ExperienceDraft) => {
    const post = await postsApi.create(values)
    setDraft(emptyDraft())
    setWriteOpen(false)
    setScreen('board')
    window.location.hash = 'board'
    setInitialResult(post.resultType)
    setBoardVersion((version) => version + 1)
    setNotice('경험을 등록했어요.')
  }

  const navigate = (label: string) => {
    if (needsNickname()) { setAuthView('nickname'); return }
    if (label !== '홈' && label !== '경험 게시판' && label !== '도전 요인 분석' && label !== '체크리스트' && label !== '마이페이지' && label !== 'AI 로드맵') {
      setNotice(`${label} 화면을 준비하고 있어요.`)
      return
    }
    closeAuth(); closeDetail(); setNotice('')
    const next = label === '홈' ? 'home' : label === 'AI 로드맵' ? 'roadmap' : label === '마이페이지' ? 'mypage' : label === '체크리스트' ? 'checklist' : label === '도전 요인 분석' ? 'analysis' : 'board'
    setScreen(next)
    window.location.hash = next
    window.scrollTo(0, 0)
  }
  const toggleHelpful = async () => {
    if (!selected || !helpful || !me || me.id === selected.authorId || reactionLock.current) return
    const id = selected.id
    reactionLock.current = true
    setHelpfulBusy(true)
    setReactionError('')
    try {
      const reaction = await postsApi.setHelpful(id, !helpful.helped)
      const stages = { SEED: '씨앗', SPROUT: '싹', BUD: '봉우리', FLOWER: '꽃' } as const
      setSelected((post) => post?.id === id ? { ...post, helpful: reaction.helpfulCount, growth: stages[reaction.growthStage] } : post)
      setHelpful((previous) => previous?.postId === id ? reaction : previous)
      setRefreshKey((value) => value + 1)
    } catch (error) {
      // 충돌이 나면 다음 열기 때 최신 상태를 다시 조회할 수 있도록 메시지를 보존한다.
      setReactionError(errorMessage(error))
    } finally { reactionLock.current = false; setHelpfulBusy(false) }
  }

  return <div className="app-shell">
    <a className="skip-link" href={authView ? '#auth-content' : '#main-content'}>본문으로 바로가기</a>
    <Header nickname={me?.nickname} authenticated={authenticated} checking={sessionStatus === 'checking'}
      activePage={authView ? null : screen}
      onLogin={() => setAuthView('login')} onLogout={logout} onNickname={() => setAuthView('nickname')}
      onNavigate={navigate} />
    <div className="page-container">
      {authView && <AuthPage key={authView} mode={authView} error={authError || meError} initialNickname={authView === 'nickname' ? me?.nickname : ''}
        required={authView === 'nickname' && needsNickname()} onClose={closeAuth} onLogout={logout}
        onPreview={() => setAuthView('preview')} onSwitch={() => setAuthView(authView === 'signup' ? 'login' : 'signup')} onSave={saveNickname} />}
      <div hidden={Boolean(authView)}>
      {meError && <div className="api-banner" role="alert">
        <span>{meError}</span>
        {hasSession && <button onClick={() => { setSessionStatus('checking'); setMeRetry((value) => value + 1) }}>다시 확인</button>}
        <button onClick={() => setAuthView('login')}>로그인</button>
      </div>}
      {(detailLoading || detailError) && <div className="api-banner" role={detailError ? 'alert' : 'status'}>
        <span>{detailLoading ? '경험을 불러오는 중이에요.' : detailError}</span>
        {detailError && <button onClick={retryDetail}>다시 시도</button>}
        <button onClick={closeDetail}>닫기</button>
      </div>}
      {screen === 'home' && <HomePage onBoard={() => navigate('경험 게시판')} onAnalysis={() => navigate('도전 요인 분석')} />}
      {screen === 'board' && <BoardPage key={boardVersion} initialResult={initialResult} refreshKey={refreshKey}
        onWrite={openWrite} onDetail={(item) => openDetail(item.id)} />}
      {screen === 'analysis' && <AnalysisPage authenticated={authenticated} userId={me?.id} onLogin={() => setAuthView('login')} onChecklist={() => navigate('체크리스트')} onDetail={(item) => openDetail(item.id)} />}
      {screen === 'checklist' && <ChecklistPage key={me?.id ?? 'guest'} authenticated={authenticated} onLogin={() => setAuthView('login')} onAnalysis={() => navigate('도전 요인 분석')} />}
      {screen === 'mypage' && <MyPage key={me?.id ?? 'guest'} authenticated={authenticated} userId={me?.id} nickname={me?.nickname} refreshKey={refreshKey}
        onLogin={() => setAuthView('login')} onNickname={() => setAuthView('nickname')} onDetail={openDetail} onWrite={openWrite}
        onChecklist={() => navigate('체크리스트')} onRoadmap={() => navigate('AI 로드맵')} onChanged={() => setRefreshKey((value) => value + 1)} />}
      {screen === 'roadmap' && <RoadmapPage key={me?.id ?? 'guest'} authenticated={authenticated} onLogin={() => setAuthView('login')} onWrite={openWrite} onChecklist={() => navigate('체크리스트')} />}
      </div>
    </div>
    {selected && selected.id === selectedId && <DetailModal key={selected.id} item={selected}
      currentUserId={me?.id}
      onReportSuccess={() => setRefreshKey((value) => value + 1)}
      helped={helpful?.helped ?? false} saved={savedIds.includes(selected.id)}
      helpfulBusy={helpfulBusy} helpfulDisabled={!me || me.id === selected.authorId} error={reactionError}
      onClose={closeDetail} onToggleHelpful={() => void toggleHelpful()}
      onToggleSave={() => setSavedIds((ids) => ids.includes(selected.id) ? ids.filter((id) => id !== selected.id) : [...ids, selected.id])}
      onWrite={openWrite} />}
    {writeOpen && <WriteModal draft={draft} onChange={setDraft} onClose={() => setWriteOpen(false)} onComplete={completeWrite} />}
    {!authView && screen !== 'roadmap' && <button className="ai-fab" onClick={() => navigate('AI 로드맵')} aria-label="AI 로드맵 열기">
      <img src={aiMascot} alt="" /><span>AI 로드맵</span>
    </button>}
    <Footer />
    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="안내 닫기"><X size={16} /></button></div>}
  </div>
}

export default App
