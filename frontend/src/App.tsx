import { useState } from 'react'
import { X } from 'lucide-react'
import { Header } from './components/Header'
import { BoardPage } from './pages/BoardPage'
import { DetailModal } from './pages/DetailModal'
import { WriteModal } from './pages/WriteModal'
import { experiences } from './data/experiences'
import { createDemoExperience, emptyDraft } from './utils/experienceDraft'
import type { ExperienceDraft } from './utils/experienceDraft'
import type { ResultType } from './types/experience'
import bloomingLogo from './assets/blooming-logo.png'
import aiMascot from './assets/ai-mascot.png'
import './App.css'

function App() {
  const [notice, setNotice] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [helpedIds, setHelpedIds] = useState<number[]>([])
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [posts, setPosts] = useState(experiences)
  const [writeOpen, setWriteOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [boardVersion, setBoardVersion] = useState(0)
  const [initialResult, setInitialResult] = useState<ResultType>('성공')
  const visibleExperiences = posts.map((item) => ({
    ...item,
    helpful: item.helpful + (helpedIds.includes(item.id) ? 1 : 0),
  }))
  const selected = visibleExperiences.find((item) => item.id === selectedId)
  const toggleId = (ids: number[], id: number) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]
  const openWrite = () => { setSelectedId(null); setWriteOpen(true); setNotice('') }
  const completeWrite = (values: ExperienceDraft) => {
    const post = createDemoExperience(values, Math.max(0, ...posts.map((item) => item.id)) + 1)
    setPosts((items) => [post, ...items])
    setDraft(emptyDraft())
    setWriteOpen(false)
    setInitialResult(post.result)
    setBoardVersion((version) => version + 1)
    setNotice('이 화면에 경험을 추가했어요. 새로고침하면 초기화돼요.')
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <Header onNavigate={(label) => setNotice(`${label} 화면을 준비하고 있어요.`)} />
      <div className="page-container">
        <BoardPage
          key={boardVersion}
          initialResult={initialResult}
          experiences={visibleExperiences}
          onWrite={openWrite}
          onDetail={(item) => setSelectedId(item.id)}
        />
      </div>
      {selected && <DetailModal key={selected.id} item={selected}
        helped={helpedIds.includes(selected.id)} saved={savedIds.includes(selected.id)}
        onClose={() => setSelectedId(null)}
        onToggleHelpful={() => setHelpedIds((ids) => toggleId(ids, selected.id))}
        onToggleSave={() => setSavedIds((ids) => toggleId(ids, selected.id))}
        onWrite={openWrite}
      />}
      {writeOpen && <WriteModal draft={draft} onChange={setDraft} onClose={() => setWriteOpen(false)} onComplete={completeWrite} />}
      <button className="ai-fab" onClick={() => setNotice('AI 로드맵 화면을 준비하고 있어요.')} aria-label="AI 로드맵 열기">
        <img src={aiMascot} alt="" /><span>AI 로드맵</span>
      </button>
      <footer className="site-footer"><div>
        <img className="footer-logo-image" src={bloomingLogo} alt="BLOOMING" />
        <p>모든 경험은 다음 도전을 위한 성장의 재료입니다.</p>
      </div></footer>
      {notice && <div className="notice" role="status">
        <span>{notice}</span><button onClick={() => setNotice('')} aria-label="안내 닫기"><X size={16} /></button>
      </div>}
    </div>
  )
}

export default App
