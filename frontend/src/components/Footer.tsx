import bloomingSymbol from '../assets/blooming-symbol.png'
import './Footer.css'

const copyrightYear = new Date().getFullYear()

export function Footer() {
  return <footer className="site-footer">
    <div className="footer-inner">
      <a className="footer-mark" href="#home" aria-label="BLOOMING 홈"><img src={bloomingSymbol} alt="" /></a>
      <div className="footer-content">
        <div className="footer-heading"><span className="footer-wordmark">BLOOMING</span><nav aria-label="푸터"><a className="footer-privacy" href="/privacy.html" target="_blank" rel="noopener noreferrer">개인정보처리방침<span className="sr-only"> (새 창)</span></a></nav></div>
        <p className="footer-description">모든 경험은 다음 도전을 위한 성장의 재료입니다.</p>
        <p className="footer-copyright">© {copyrightYear} BLOOMING. All rights reserved.</p>
      </div>
    </div>
  </footer>
}
