import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consumeOAuthCallback } from './api/auth'
import { ReportPreview } from './pages/ReportPreview'
import { ChecklistPreview } from './pages/ChecklistPreview'
import { MyPagePreview } from './pages/MyPagePreview'
import { RoadmapPreview } from './pages/RoadmapPreview'

const callback = consumeOAuthCallback(window.location.href, (url) => window.history.replaceState(null, '', url))
const previewNickname = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'nickname'
const previewReport = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'report'
const previewChecklist = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'checklist'
const previewMyPage = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'mypage'
const previewRoadmap = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'roadmap'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {previewRoadmap ? <RoadmapPreview /> : previewMyPage ? <MyPagePreview /> : previewChecklist ? <ChecklistPreview /> : previewReport ? <ReportPreview /> : <App initialAuthError={callback.error} previewNickname={previewNickname} />}
  </StrictMode>,
)
