import { useState } from 'react'
import { X } from 'lucide-react'
import { Header } from './components/Header'
import bloomingLogo from './assets/blooming-logo.png'
import aiMascot from './assets/ai-mascot.png'
import './App.css'

function App() {
  const [notice, setNotice] = useState('')
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <Header onNavigate={(label) => setNotice(`${label} 화면을 준비하고 있어요.`)} />
      <div className="page-container">
        <main id="main-content">
          <section className="page-heading"><div>
            <h1>경험 게시판</h1>
            <p>성공도, 실패도, 잠시 멈춘 경험도 누군가의 다음 선택에 도움이 됩니다.</p>
          </div></section>
        </main>
      </div>
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
