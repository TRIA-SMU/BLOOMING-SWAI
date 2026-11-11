import { useState } from 'react'
import { Menu, X, UserRound, ChevronRight, LogOut, Route } from 'lucide-react'
import bloomingSymbol from '../assets/blooming-symbol.png'

export function Header({ onNavigate, nickname, authenticated, checking, activePage = 'board', onLogin, onLogout, onNickname }: {
  onNavigate: (label: string) => void
  nickname?: string
  authenticated: boolean
  checking: boolean
  activePage?: 'home' | 'board' | 'analysis' | 'checklist' | 'mypage' | 'roadmap' | null
  onLogin: () => void
  onLogout: () => void
  onNickname: () => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = (label: string) => {
    setMobileOpen(false)
    setProfileOpen(false)
    if (label === '경험 게시판') window.scrollTo({ top: 0, behavior: 'smooth' })
    onNavigate(label)
  }
  return <header className="site-header"><div className="header-inner">
    <button className="logo" onClick={() => navigate('홈')} aria-label="BLOOMING 홈">
      <img className="header-logo-symbol" src={bloomingSymbol} alt="" />
      <span className="header-logo-word">BLOOMING</span>
    </button>
    <nav id="main-navigation" className={`main-nav${mobileOpen ? ' main-nav--open' : ''}`} aria-label="주요 메뉴">
      {([{ label: '경험 게시판', page: 'board' }, { label: '도전 요인 분석', page: 'analysis' }, { label: '체크리스트', page: 'checklist' }] as const).map(({ label, page }) => <button
        key={label} className={`nav-item${activePage === page ? ' nav-item--active' : ''}`}
        aria-current={activePage === page ? 'page' : undefined}
        onClick={() => navigate(label)}>{label}</button>)}
    </nav>
    <div className="header-actions">
      {authenticated ? <div className="profile-menu-wrap">
        <button className="profile-trigger" aria-label="마이페이지 메뉴" aria-expanded={profileOpen}
          aria-controls="profile-menu" onClick={() => { setProfileOpen(!profileOpen); setMobileOpen(false) }}>
          <UserRound size={18} />
        </button>
        {profileOpen && <>
          <button className="menu-dismiss" aria-label="프로필 메뉴 닫기" onClick={() => setProfileOpen(false)} />
          <div id="profile-menu" className="profile-dropdown" onKeyDown={(event) => { if (event.key === 'Escape') setProfileOpen(false) }}>
            <div className="profile-dropdown-head"><UserRound size={22} /><div><strong>{nickname ?? '내 정보'}</strong></div></div>
            <button onClick={() => navigate('마이페이지')}><UserRound size={16} /><span>마이페이지</span><ChevronRight size={15} /></button>
            <button onClick={() => navigate('AI 로드맵')}><Route size={16} /><span>AI 로드맵</span><ChevronRight size={15} /></button>
            <button onClick={() => { setProfileOpen(false); onNickname() }}><UserRound size={16} /><span>닉네임 변경</span><ChevronRight size={15} /></button>
            <button onClick={() => { setProfileOpen(false); onLogout() }}><LogOut size={16} /><span>로그아웃</span><ChevronRight size={15} /></button>
          </div>
        </>}
      </div> : <button className="header-login-button" disabled={checking} onClick={onLogin}>{checking ? '확인 중…' : '로그인'}</button>}
      <button className="mobile-menu" aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={mobileOpen}
        aria-controls="main-navigation" onClick={() => { setMobileOpen(!mobileOpen); setProfileOpen(false) }}>
        {mobileOpen ? <X size={23} /> : <Menu size={23} />}
      </button>
    </div>
  </div></header>
}
