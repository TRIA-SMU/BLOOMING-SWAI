import { useState } from 'react'
import { X } from 'lucide-react'
import { Header } from './components/Header'
import { BoardPage } from './pages/BoardPage'
import { DetailModal } from './pages/DetailModal'
import { experiences } from './data/experiences'
import bloomingLogo from './assets/blooming-logo.png'
import aiMascot from './assets/ai-mascot.png'
import './App.css'

function App() {
  const [notice, setNotice] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [helpedIds, setHelpedIds] = useState<number[]>([])
  const [savedIds, setSavedIds] = useState<number[]>([])
  const visibleExperiences = experiences.map((item) => ({
    ...item,
    helpful: item.helpful + (helpedIds.includes(item.id) ? 1 : 0),
  }))
  const selected = visibleExperiences.find((item) => item.id === selectedId)
  const toggleId = (ids: number[], id: number) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <Header onNavigate={(label) => setNotice(`${label} 화면을 준비하고 있어요.`)} />
      <div className="page-container">
        <BoardPage
          experiences={visibleExperiences}
          onWrite={() => setNotice('경험 기록 화면을 준비하고 있어요.')}
          onDetail={(item) => setSelectedId(item.id)}
        />
      </div>
      {selected && <DetailModal key={selected.id} item={selected}
        helped={helpedIds.includes(selected.id)} saved={savedIds.includes(selected.id)}
        onClose={() => setSelectedId(null)}
        onToggleHelpful={() => setHelpedIds((ids) => toggleId(ids, selected.id))}
        onToggleSave={() => setSavedIds((ids) => toggleId(ids, selected.id))}
        onWrite={() => { setSelectedId(null); setNotice('경험 기록 화면을 준비하고 있어요.') }}
      />}
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
