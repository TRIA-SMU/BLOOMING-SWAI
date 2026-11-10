import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Header } from './components/Header'
import { BoardPage } from './pages/BoardPage'
import { DetailModal } from './pages/DetailModal'
import { WriteModal } from './pages/WriteModal'
import { detailToExperience, postsApi } from './api/posts'
import type { HelpfulResponse, Me, ResultCode } from './api/posts'
import { errorMessage } from './api/client'
import { emptyDraft } from './utils/experienceDraft'
import type { ExperienceDraft } from './utils/experienceDraft'
import type { Experience } from './types/experience'
import bloomingLogo from './assets/blooming-logo.png'
import aiMascot from './assets/ai-mascot.png'
import './App.css'

function App() {
  const [notice, setNotice] = useState('')
  const [me, setMe] = useState<Me | null>(null)
  const [meError, setMeError] = useState('')
  const [meRetry, setMeRetry] = useState(0)
  const [authRequired, setAuthRequired] = useState(false)
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

  useEffect(() => {
    const controller = new AbortController()
    postsApi.me(controller.signal)
      .then((user) => { if (!controller.signal.aborted) { setMe(user); setMeError(''); setAuthRequired(false) } })
      .catch((error: unknown) => { if (!controller.signal.aborted) { setMe(null); setMeError(errorMessage(error)) } })
    return () => controller.abort()
  }, [meRetry])

  useEffect(() => {
    const requireLogin = () => { setMe(null); setAuthRequired(true) }
    window.addEventListener('blooming:unauthorized', requireLogin)
    return () => window.removeEventListener('blooming:unauthorized', requireLogin)
  }, [])

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
    setSelected(null); setHelpful(null); setDetailError(''); setReactionError(''); setDetailLoading(true); setSelectedId(id)
    setDetailRetry((value) => value + 1)
  }
  const retryDetail = () => { setDetailError(''); setDetailLoading(true); setDetailRetry((value) => value + 1) }
  const openWrite = () => { closeDetail(); setWriteOpen(true); setNotice('') }
  const completeWrite = async (values: ExperienceDraft) => {
    const post = await postsApi.create(values)
    setDraft(emptyDraft())
    setWriteOpen(false)
    setInitialResult(post.resultType)
    setBoardVersion((version) => version + 1)
    setNotice('경험을 등록했어요.')
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
    <a className="skip-link" href="#main-content">본문으로 바로가기</a>
    <Header nickname={me?.nickname} onNavigate={(label) => setNotice(`${label} 화면을 준비하고 있어요.`)} />
    <div className="page-container">
      {(meError || authRequired) && <div className="api-banner" role="alert">
        <span>{authRequired ? '로그인이 필요해요. 다시 로그인해 주세요.' : meError}</span>
        <button onClick={() => setMeRetry((value) => value + 1)}>내 정보 다시 확인</button>
      </div>}
      {(detailLoading || detailError) && <div className="api-banner" role={detailError ? 'alert' : 'status'}>
        <span>{detailLoading ? '경험을 불러오는 중이에요.' : detailError}</span>
        {detailError && <button onClick={retryDetail}>다시 시도</button>}
        <button onClick={closeDetail}>닫기</button>
      </div>}
      <BoardPage key={boardVersion} initialResult={initialResult} refreshKey={refreshKey}
        onWrite={openWrite} onDetail={(item) => openDetail(item.id)} />
    </div>
    {selected && selected.id === selectedId && <DetailModal key={selected.id} item={selected}
      helped={helpful?.helped ?? false} saved={savedIds.includes(selected.id)}
      helpfulBusy={helpfulBusy} helpfulDisabled={!me || me.id === selected.authorId} error={reactionError}
      onClose={closeDetail} onToggleHelpful={() => void toggleHelpful()}
      onToggleSave={() => setSavedIds((ids) => ids.includes(selected.id) ? ids.filter((id) => id !== selected.id) : [...ids, selected.id])}
      onWrite={openWrite} />}
    {writeOpen && <WriteModal draft={draft} onChange={setDraft} onClose={() => setWriteOpen(false)} onComplete={completeWrite} />}
    <button className="ai-fab" onClick={() => setNotice('AI 로드맵 화면을 준비하고 있어요.')} aria-label="AI 로드맵 열기">
      <img src={aiMascot} alt="" /><span>AI 로드맵</span>
    </button>
    <footer className="site-footer"><div><img className="footer-logo-image" src={bloomingLogo} alt="BLOOMING" /><p>모든 경험은 다음 도전을 위한 성장의 재료입니다.</p></div></footer>
    {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="안내 닫기"><X size={16} /></button></div>}
  </div>
}

export default App
