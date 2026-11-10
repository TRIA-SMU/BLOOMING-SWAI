import { ArrowRight } from 'lucide-react'
import './HomePage.css'

export function HomePage({ onBoard, onAnalysis }: { onBoard: () => void; onAnalysis: () => void }) {
  return <main id="main-content" className="home-page home-page--minimal">
    <section className="minimal-hero" aria-labelledby="home-title">
      <h1 id="home-title" className="minimal-wordmark">BLOOMING</h1>
      <p>성공도 실패도, 다음 도전의 씨앗이 되어 꽃피우는 경험 기록 플랫폼</p>
      <div className="hero-actions">
        <button className="button button--primary" onClick={onBoard}>경험 둘러보기 <ArrowRight size={16} /></button>
        <button className="button button--secondary" onClick={onAnalysis}>내 도전 분석하기</button>
      </div>
    </section>
  </main>
}
