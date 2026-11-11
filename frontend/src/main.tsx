import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consumeOAuthCallback } from './api/auth'
import { ReportPreview } from './pages/ReportPreview'
import { ChecklistPreview } from './pages/ChecklistPreview'

const callback = consumeOAuthCallback(window.location.href, (url) => window.history.replaceState(null, '', url))
const previewNickname = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'nickname'
const previewReport = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'report'
const previewChecklist = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'checklist'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {previewChecklist ? <ChecklistPreview /> : previewReport ? <ReportPreview /> : <App initialAuthError={callback.error} previewNickname={previewNickname} />}
  </StrictMode>,
)
